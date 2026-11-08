import type { NextConfig } from "next";
import type webpack from "webpack";
import { writeScenariosToFile } from "./src/server/_loadScenarios";

class WriteScenariosPlugin {
    apply(compiler: webpack.Compiler) {
        compiler.hooks.done.tap(WriteScenariosPlugin.name, writeScenariosToFile);
    }
}

const nextConfig: NextConfig = {
    // Bundles the server and only the node_modules it needs into .next/standalone,
    // so the host can run it without an npm install. See devops/playbook.yml
    output: "standalone",
    // Build-time tooling that next-server's trace picks up but the production server never loads
    outputFileTracingExcludes: {
        "*": [
            "node_modules/webpack/**",
            "node_modules/esbuild/**",
            "node_modules/@esbuild/**",
            "node_modules/terser/**",
            "node_modules/sass/**",
        ],
    },
    // Disable compression to avoid memory issues
    compress: false,
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

export default nextConfig;
