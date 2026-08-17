"""Tests for the widget delivery path.

Nothing covered this before, which is how the package came to ship without its
Python modules, look for its assets outside the installed package, and expose
the wrong notebook render hook — all at once, undetected.
"""
import pathlib

import pytest

import pratyaksha
from pratyaksha import Stack, StructureType
from pratyaksha.widget import _CSS_PATH, _ESM_PATH, VisualizerWidget, _read_asset


def test_assets_live_inside_the_package():
    """Assets must resolve relative to the package, not the repo root.

    The old path was `__file__/../dist`, which points at site-packages/dist
    after install — a directory that never exists.
    """
    package_dir = pathlib.Path(pratyaksha.__file__).parent
    assert _ESM_PATH.parent == package_dir / "static"
    assert package_dir in _ESM_PATH.parents


def test_assets_are_present_and_non_empty():
    assert _ESM_PATH.exists(), "run `npm run build-lib`"
    assert _CSS_PATH.exists(), "run `npm run build-lib`"
    assert VisualizerWidget._esm.strip(), "empty _esm renders a blank widget"
    assert VisualizerWidget._css.strip()


def test_missing_asset_raises_instead_of_failing_silently(tmp_path):
    with pytest.raises(RuntimeError, match="build-lib"):
        _read_asset(tmp_path / "does-not-exist.mjs")


def test_widget_uses_the_mimebundle_render_protocol():
    """anywidget renders through _repr_mimebundle_, not _repr_html_.

    Defining _repr_html_ actively breaks rendering: IPython prefers it, and a
    static HTML string cannot carry the comm channel updates travel over.
    """
    stack = Stack()
    assert not hasattr(stack, "_repr_html_")

    bundle = stack._repr_mimebundle_()
    if isinstance(bundle, tuple):
        bundle = bundle[0]

    assert "application/vnd.jupyter.widget-view+json" in bundle


def test_structure_reaches_the_widget_as_a_plain_string():
    """The bridge routes on this value, so it must serialise as the bare name."""
    stack = Stack()
    assert stack.widget.structure == StructureType.STACK.value
    assert type(stack.widget.structure) is str


def test_version_is_exposed():
    assert pratyaksha.__version__
