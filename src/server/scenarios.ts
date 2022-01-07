import getConfig from "next/config";

import { Scenario } from "types";

const {
    serverRuntimeConfig: { scenarios: scenariosFromConfig },
} = getConfig();

export const scenarios: Scenario[] = scenariosFromConfig || [];

export const mapScenarios = <T, E>(
    scenarioIds: string[],
    callback: (scenario: Scenario) => T,
    handleError?: (err: Error, scenario: Scenario) => E
): (T | E)[] => {
    const scenariosForNames = scenarioIds.map((id) => {
        const scenario = scenarios.find((sc) => sc.id === id);
        if (scenario) {
            return scenario;
        }
        throw new Error(`No scenario with id=${id}`);
    });
    return scenariosForNames.map((scenario) => {
        try {
            return callback(scenario);
        } catch (err) {
            console.log(`[in mapScenarios]`, err);
            return handleError ? handleError(err, scenario) : err;
        }
    });
};
