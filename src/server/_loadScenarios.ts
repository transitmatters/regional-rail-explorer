/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * This file is intended to be imported from next.config.js only. Do not load import this file from
 * a Next Page or API route or it will slow down the entire server!
 */
import path from "path";
import { loadGtfsNetwork } from "./network";

const gtfsNetwork = (subpath) => loadGtfsNetwork(path.resolve(process.cwd(), "data", subpath));

export const loadScenarios = () => {
    return [
        {
            id: "present",
            name: "Today's commuter rail",
            network: gtfsNetwork("gtfs-2019"),
            amenitiesByRoute: {},
            amenitiesByStation: {},
        },
        {
            id: "phase_one",
            name: "Regional Rail Phase One",
            network: gtfsNetwork("phase-one-testing"),
            amenitiesByRoute: {
                "CR-Newburyport": ["electric-trains", "increased-top-speed"],
            },
            amenitiesByStation: {},
        },
    ];
};
