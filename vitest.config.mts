import { defineConfig } from "vitest/config";

export default defineConfig({
    // Resolves imports like "types" and "server/..." against tsconfig's baseUrl (./src)
    resolve: { tsconfigPaths: true },
    test: {
        include: ["src/**/*.test.ts"],
        environment: "node",
        // Building both networks from the GTFS archives takes a while
        hookTimeout: 5 * 60_000,
        testTimeout: 5 * 60_000,
    },
});
