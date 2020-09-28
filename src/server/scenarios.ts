import path from "path";

import { Scenario } from "types";
import { loadGtfsNetwork } from "./network";

const gtfsNetwork = (subpath) => loadGtfsNetwork(path.resolve(process.cwd(), "data", subpath));

export const scenarios: Record<string, Scenario> = {
    present: {
        name: "Today's commuter rail",
        network: gtfsNetwork("gtfs-2019"),
        amenitiesByRoute: {},
        amenitiesByStation: {},
    },
    phase_one: {
        name: "Regional Rail Phase One",
        network: gtfsNetwork("gtfs-phase-one"),
        amenitiesByRoute: {
            "CR-Newburyport": ["electric-trains", "increased-top-speed"],
        },
        amenitiesByStation: {},
    },
};

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
