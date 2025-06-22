import type { NextConfig } from "next";
import webpack from "webpack";
import { loadScenariosFromFile, writeScenariosToFile } from "./src/server/_loadScenarios";

import { PHASE_PRODUCTION_SERVER, PHASE_DEVELOPMENT_SERVER } from "next/dist/shared/lib/constants";

class WriteScenariosPlugin {
    apply(compiler: webpack.Compiler) {
        compiler.hooks.done.tap(WriteScenariosPlugin.name, writeScenariosToFile);
    }
}

const getServerRuntimeConfig = (phase: string) => {
    if (phase === PHASE_PRODUCTION_SERVER || phase === PHASE_DEVELOPMENT_SERVER) {
        return { scenarios: loadScenariosFromFile() };
    }

    return {};
};

const nextConfig: NextConfig = (phase: string) => {
    return {
        // Disable compression to avoid memory issues
        compress: false,
        serverRuntimeConfig: getServerRuntimeConfig(phase),
        webpack: (config: any, options: any) => {
            config.optimization = {
                ...config.optimization,
                moduleIds: "deterministic",
                chunkIds: "deterministic",
            };

            if (!options.isServer) {
                config.plugins.push(new WriteScenariosPlugin());
            }

            return config;
        },
    };
};

export default nextConfig;
