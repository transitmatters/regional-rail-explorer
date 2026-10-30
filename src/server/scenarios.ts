import fs from "fs";
import path from "path";
import { Scenario, scenarioIds } from "types";

import { deserializeNetwork, SCENARIOS_FILE_VERSION, ScenariosFile } from "./network/serialize";

let scenarios: Scenario[] | null = null;

// scenarios.json is written at build time by WriteScenariosPlugin (next.config.ts). It's read
// lazily so the dev server doesn't race the plugin, and relative to cwd because the standalone
// server.js chdirs into its own directory, where the deploy places scenarios.json.
const getScenarios = (): Scenario[] => {
    if (!scenarios) {
        const file: ScenariosFile = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), "scenarios.json"), "utf8")
        );
        if (file.version !== SCENARIOS_FILE_VERSION) {
            throw new Error(
                `scenarios.json is version ${file.version}, expected ${SCENARIOS_FILE_VERSION}. Rebuild it.`
            );
        }
        scenarios = file.scenarios.map((scenario) => ({
            ...scenario,
            network: deserializeNetwork(scenario.network),
        }));
    }
    return scenarios;
};

export const mapScenarios = <T, E>(
    callback: (scenario: Scenario) => T,
    handleError?: (err: Error, scenario: Scenario) => E
): (T | E)[] => {
    const scenariosById = scenarioIds.map((id) => {
        const scenario = getScenarios().find((sc) => sc.id === id);
        if (scenario) {
            return scenario;
        }
        throw new Error(`No scenario with id=${id}`);
    });
    return scenariosById.map((scenario) => {
        try {
            return callback(scenario);
        } catch (err) {
            console.log(`[in mapScenarios]`, err);
            return handleError ? handleError(err, scenario) : err;
        }
    });
};
