import fs from "fs";
import path from "path";

import { loadGtfsNetwork } from "./network";
import { stringify, parse } from "flatted";

const GTFS_NETWORKS = [
    {
        id: "present",
        name: "Today's commuter rail",
        unifiedFares: false,
        networkName: "gtfs-present",
    },
    {
        id: "regional_rail",
        name: "PMT25 Expansion",
        unifiedFares: true,
        networkName: "gtfs-expansion",
    },
];

const getGtfsFilePath = (networkName: string): string => {
    const filePath = path.resolve(process.cwd(), "data", networkName + ".tar.gz");
    return filePath;
};

export const loadScenariosFromFile = (): JSON => {
    return parse(fs.readFileSync("./scenarios.json", "utf8"));
};

export const loadScenariosFromGtfs = () => {
    return GTFS_NETWORKS.map((networkDetails) => ({
        id: networkDetails.id,
        name: networkDetails.name,
        unifiedFares: networkDetails.unifiedFares,
        network: loadGtfsNetwork(getGtfsFilePath(networkDetails.networkName)),
    }));
};

export const writeScenariosToFile = () => {
    const scenariosFileIsUpToDate = GTFS_NETWORKS.every((network) => {
        try {
            const scenariosFileStat = fs.statSync("./scenarios.json");
            const gtfsFileStat = fs.statSync(getGtfsFilePath(network.networkName));

            if (gtfsFileStat.mtime < scenariosFileStat.mtime) {
                return true;
            }
        } catch (err) {
            return false;
        }
    });

    // Skip update if gtfs data has not changed
    if (scenariosFileIsUpToDate) {
        return;
    }

    const scenarios = loadScenariosFromGtfs();

    // Update scenarios.json if gtfs data has changed
    fs.writeFileSync("./scenarios.json", stringify(scenarios));
};
