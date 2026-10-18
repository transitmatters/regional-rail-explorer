import fs from "fs";
import path from "path";
import { parse } from "flatted";

import { Scenario, scenarioIds } from "types";

let scenarios: Scenario[] | null = null;

// scenarios.json is written at build time by WriteScenariosPlugin (next.config.ts). It's read
// lazily so the dev server doesn't race the plugin, and relative to cwd because the standalone
// server.js chdirs into its own directory, where the deploy places scenarios.json.
const getScenarios = (): Scenario[] => {
    if (!scenarios) {
        scenarios = parse(
            fs.readFileSync(path.join(process.cwd(), "scenarios.json"), "utf8")
        ) as Scenario[];
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
