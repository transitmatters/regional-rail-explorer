import type { NextConfig } from "next";
import webpack from "webpack";
import fs from "fs";
import path from "path";
import memoize from "fast-memoize";
import { loadScenarios } from "./src/server/_loadScenarios";
import { stringify, parse } from "flatted";

import { PHASE_PRODUCTION_SERVER, PHASE_DEVELOPMENT_SERVER } from "next/dist/shared/lib/constants";

const loadScenariosFromFile = () => {
    return fs.readFileSync("./scenarios.json", "utf8");
};

const createScenariosJsonString = memoize(() => {
    return stringify(loadScenarios());
});

const writeScenariosFile = () => {
    fs.writeFileSync("./scenarios.json", createScenariosJsonString());
};

class WriteScenariosPlugin {
    apply(compiler: webpack.Compiler) {
        compiler.hooks.done.tap(WriteScenariosPlugin.name, writeScenariosFile);
    }
}

const getServerRuntimeConfig = (phase) => {
    if (phase === PHASE_PRODUCTION_SERVER || PHASE_DEVELOPMENT_SERVER) {
        return { scenarios: parse(loadScenariosFromFile()) };
    }
    return {};
};

const nextConfig: NextConfig = (phase) => {
    return {
        serverRuntimeConfig: getServerRuntimeConfig(phase),
        webpack: (config, options) => {
            if (!options.isServer) {
                config.plugins.push(new WriteScenariosPlugin());
            }

            return config;
        },
    };
};

export default nextConfig;
