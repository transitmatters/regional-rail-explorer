import { parse } from "flatted";
import getConfig from "next/config";

import { Scenario } from "types";
import { loadScenarios } from "./_loadScenarios";

const {
    serverRuntimeConfig: { scenarios: scenariosString },
} = getConfig();

export const scenarios: Record<string, Scenario> =
    process.env.NODE_ENV === "production" ? loadScenarios() : parse(scenariosString);

export const mapScenarios = <T, E>(
    scenarioNames: string[],
    callback: (scenario: Scenario) => T,
    handleError: (err: Error, scenario: Scenario) => E
): (T | E)[] => {
    const scenariosForNames = scenarioNames.map((name) => {
        if (scenarios[name]) {
            return scenarios[name];
        }
        throw new Error(`No scenario named ${name}`);
    });
    return scenariosForNames.map((scenario) => {
        try {
            return callback(scenario);
        } catch (err) {
            console.log(`[in mapScenarios]`, err);
            return handleError(err, scenario);
        }
    });
};
