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
            network: gtfsNetwork("gtfs-present"),
        },
        {
            id: "regional_rail",
            name: "Electrified regional rail",
            unifiedFares: true,
            network: gtfsNetwork("gtfs-regional-rail"),
        },
    ];
};
