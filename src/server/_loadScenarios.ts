/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * This file is intended to be imported from next.config.js only. Do not load import this file from
 * a Next Page or API route or it will slow down the entire server!
 */
import path from "path";
import { loadGtfsNetwork } from "./network";

const gtfsNetwork = (networkName: string) =>
    loadGtfsNetwork(path.resolve(process.cwd(), "data", networkName + ".tar.gz"));

export const loadScenarios = () => {
    return [
        {
            id: "present",
            name: "Today's commuter rail",
            unifiedFares: false,
            network: gtfsNetwork("gtfs-2019"),
        },
        {
            id: "phase_one",
            name: "Regional Rail Phase One",
            unifiedFares: true,
            network: gtfsNetwork("gtfs-phase-one"),
        },
    ];
};
