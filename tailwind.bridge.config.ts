import type { Config } from "tailwindcss";
import baseConfig from "./tailwind.config";

/**
 * Tailwind config for the notebook widget bundle.
 *
 * Identical to the web app's config except that Preflight is disabled: the
 * generated CSS is injected into the Jupyter/Colab document, and Preflight's
 * global element resets would restyle the notebook chrome around the widget.
 */
export default {
    ...baseConfig,
    corePlugins: {
        preflight: false,
    },
} satisfies Config;
