"""Runs Pratyaksha inside a real Jupyter kernel, the way a notebook does.

The rest of the Python suite imports the package directly, which is a weaker
claim than it looks: a notebook goes through a separate kernel process, imports
from the *installed* package rather than the working tree, and renders through
the mimebundle protocol. Every one of those can break while the unit tests stay
green — a missing asset in the wheel, an import that only resolves relative to
the repo, a render hook that returns the wrong shape.

`pratyaksha_phases.md` P1 opens with "do not start until a Stack renders and
updates in a real notebook". This is that check, run every time rather than
once by hand.

Skipped when the notebook stack is not installed, so a plain `pytest` still
works; CI installs it explicitly.
"""

import pytest

nbformat = pytest.importorskip("nbformat", reason="notebook stack not installed")
nbclient = pytest.importorskip("nbclient", reason="notebook stack not installed")
pytest.importorskip("ipykernel", reason="no kernel to execute against")

from nbclient import NotebookClient  # noqa: E402  (after importorskip)


def _run(*sources: str):
    """Execute the given cells in a fresh kernel and return their stdout."""
    notebook = nbformat.v4.new_notebook(
        cells=[nbformat.v4.new_code_cell(s) for s in sources]
    )
    NotebookClient(notebook, timeout=120, kernel_name="python3").execute()

    outputs = []
    for cell in notebook.cells:
        text = ""
        for out in cell.get("outputs", []):
            if out.output_type == "error":
                pytest.fail(
                    f"cell raised {out.ename}: {out.evalue}\n"
                    + "\n".join(out.get("traceback", []))
                )
            if out.output_type == "stream":
                text += out.text
        outputs.append(text.strip())
    return outputs


@pytest.mark.notebook
def test_package_imports_inside_a_kernel():
    """A kernel imports the installed package, not the working tree."""
    (version,) = _run("import pratyaksha; print(pratyaksha.__version__)")
    assert version, "pratyaksha.__version__ came back empty inside the kernel"


@pytest.mark.notebook
def test_stack_renders_and_updates_in_a_kernel():
    """The P1 gate: a Stack renders through the widget protocol and its state
    follows the Python object as it is mutated."""
    mime, after_push, after_pop = _run(
        """
from pratyaksha import Stack
s = Stack()
bundle = s._repr_mimebundle_()
data = bundle[0] if isinstance(bundle, tuple) else bundle
print("application/vnd.jupyter.widget-view+json" in data)
""",
        """
for value in (10, 20, 30):
    s.push(value)
print(len(s.widget.nodes))
""",
        """
s.pop()
print(len(s.widget.nodes))
""",
    )

    assert mime == "True", "the widget view mimetype is missing, so nothing renders"
    assert after_push == "3", f"three pushes should leave three nodes, got {after_push}"
    assert after_pop == "2", f"a pop should leave two nodes, got {after_pop}"


@pytest.mark.notebook
def test_queue_renders_and_updates_in_a_kernel():
    """Queue is the other structure with a real presentational renderer, so it
    carries the same claim as Stack and is checked the same way."""
    structure, count = _run(
        """
from pratyaksha import Queue
q = Queue()
q.enqueue("a")
q.enqueue("b")
print(q.widget.structure)
""",
        "print(len(q.widget.nodes))",
    )

    assert structure == "QUEUE", "the bridge routes on this value"
    assert count == "2"


@pytest.mark.notebook
def test_static_assets_load_from_the_installed_package():
    """The bundle ships inside the package. If it were missing or resolved
    relative to the repo, the widget would render blank in a notebook while
    every unit test still passed."""
    (sizes,) = _run(
        """
import pratyaksha, pathlib
static = pathlib.Path(pratyaksha.__file__).parent / "static"
js = static / "pratyaksha-bridge.mjs"
css = static / "pratyaksha.css"
print(js.stat().st_size > 10000 and css.stat().st_size > 1000)
"""
    )
    assert sizes == "True", "the widget assets are missing from the installed package"
