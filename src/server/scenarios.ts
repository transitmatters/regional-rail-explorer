import getConfig from "next/config";
import { parse } from "flatted";

import { Scenario, scenarioIds } from "types";

const {
    serverRuntimeConfig: {
        scenarios: scenariosFromConfig,
        scenariosString: scenariosStringFromConfig,
    },
} = getConfig();

const getScenarios = (): Scenario[] => {
    if (scenariosFromConfig) {
        return scenariosFromConfig;
    } else if (scenariosStringFromConfig) {
        return parse(scenariosStringFromConfig);
    }
    return [];
};

export const scenarios: Scenario[] = getScenarios();
export const scenarioNames = typeof scenarios;

export const mapScenarios = <T, E>(
    callback: (scenario: Scenario) => T,
    handleError?: (err: Error, scenario: Scenario) => E
): (T | E)[] => {
    const scenariosById = scenarioIds.map((id) => {
        const scenario = scenarios.find((sc) => sc.id === id);
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
