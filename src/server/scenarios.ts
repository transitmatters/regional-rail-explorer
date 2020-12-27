import { parse } from "flatted";
import getConfig from "next/config";

import { Scenario } from "types";

const {
    serverRuntimeConfig: { scenarios: scenariosString },
} = getConfig();

export const scenarios = parse(scenariosString);

export const mapScenarios = <T>(
    scenarioNames: string[],
    callback: (scenario: Scenario) => T
): T[] => {
    const scenariosForNames = scenarioNames.map((name) => {
        if (scenarios[name]) {
            return scenarios[name];
        }
        throw new Error(`No scenario named ${name}`);
    });
    return scenariosForNames.map(callback);
};
