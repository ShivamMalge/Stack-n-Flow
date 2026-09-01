import pathlib

import anywidget
import traitlets

# Assets live inside the package, so they resolve identically from a source
# checkout and from site-packages after `pip install`. They are produced by
# `npm run build-lib`.
_STATIC = pathlib.Path(__file__).parent / "static"
_ESM_PATH = _STATIC / "pratyaksha-bridge.mjs"
_CSS_PATH = _STATIC / "pratyaksha.css"


def _read_asset(path: pathlib.Path) -> str:
    """Reads a bundled asset, failing loudly if it is missing.

    A missing asset used to degrade to an empty string, which renders a blank
    widget with no error — the failure mode was silent and easy to mistake for
    a broken notebook. The explicit encoding matters too: without it the file is
    decoded with the locale codec, which fails on non-ASCII content on Windows.
    """
    if not path.exists():
        raise RuntimeError(
            f"Pratyaksha asset not found: {path}\n"
            "Build the widget bundle first:  npm install && npm run build-lib"
        )
    return path.read_text(encoding="utf-8")


class VisualizerWidget(anywidget.AnyWidget):
    _esm = _read_asset(_ESM_PATH)
    _css = _read_asset(_CSS_PATH)

    structure: str = traitlets.Unicode("STACK").tag(sync=True)
    nodes = traitlets.Any([]).tag(sync=True)
    metadata: dict = traitlets.Dict({}).tag(sync=True)

    #: "auto", "light" or "dark". The widget carries the web app's own theme
    #: tokens, which default to the light palette, so in a dark notebook it
    #: rendered as a white slab. "auto" follows the browser's colour scheme;
    #: set it explicitly when that guesses wrong, which it will if the notebook
    #: theme and the OS theme disagree.
    theme: str = traitlets.Unicode("auto").tag(sync=True)
