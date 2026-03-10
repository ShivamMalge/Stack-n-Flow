import pathlib
import anywidget
import traitlets

# Look for the bundled assets in the dist directory
_dist = pathlib.Path(__file__).parent / "../dist"
_esm_path = _dist / "pratyaksha-bridge.mjs"
_css_path = _dist / "pratyaksha.css"

class VisualizerWidget(anywidget.AnyWidget):
    _esm = _esm_path.read_text() if _esm_path.exists() else ""
    _css = _css_path.read_text() if _css_path.exists() else ""
    
    structure: str = traitlets.Unicode("STACK").tag(sync=True)
    nodes: list = traitlets.List([]).tag(sync=True)
    metadata: dict = traitlets.Dict({}).tag(sync=True)
