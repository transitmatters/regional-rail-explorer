import fs from "fs";
import path from "path";

import { ScenarioId } from "types";

import { loadGtfsNetwork } from "./network";
import { SCENARIOS_FILE_VERSION, ScenariosFile, serializeNetwork } from "./network/serialize";

const GTFS_NETWORKS: {
    id: ScenarioId;
    name: string;
    unifiedFares: boolean;
    networkName: string;
}[] = [
    {
        id: "present",
        name: "Today's commuter rail",
        unifiedFares: false,
        networkName: "gtfs-present",
    },
    {
        id: "regional_rail",
        name: "Electrified regional rail",
        unifiedFares: true,
        networkName: "gtfs-regional-rail",
    },
];

const getGtfsFilePath = (networkName: string): string => {
    const filePath = path.resolve(process.cwd(), "data", networkName + ".tar.gz");
    return filePath;
};

export const loadScenariosFromGtfs = () => {
    return GTFS_NETWORKS.map((networkDetails) => ({
        id: networkDetails.id,
        name: networkDetails.name,
        unifiedFares: networkDetails.unifiedFares,
        network: loadGtfsNetwork(getGtfsFilePath(networkDetails.networkName)),
    }));
};

// The version is written first, so this only needs to read the start of the file
const readScenariosFileVersion = (): null | number => {
    const fd = fs.openSync("./scenarios.json", "r");
    try {
        const head = Buffer.alloc(32);
        fs.readSync(fd, head, 0, head.length, 0);
        const match = head.toString("utf8").match(/^\{"version":(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    } finally {
        fs.closeSync(fd);
    }
};

export const writeScenariosToFile = () => {
    const scenariosFileIsUpToDate = GTFS_NETWORKS.every((network) => {
        try {
            const scenariosFileStat = fs.statSync("./scenarios.json");
            const gtfsFileStat = fs.statSync(getGtfsFilePath(network.networkName));

            if (
                gtfsFileStat.mtime < scenariosFileStat.mtime &&
                readScenariosFileVersion() === SCENARIOS_FILE_VERSION
            ) {
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

    const file: ScenariosFile = {
        version: SCENARIOS_FILE_VERSION,
        scenarios: loadScenariosFromGtfs().map((scenario) => ({
            ...scenario,
            network: serializeNetwork(scenario.network),
        })),
    };

    // Update scenarios.json if gtfs data or the file format has changed
    fs.writeFileSync("./scenarios.json", JSON.stringify(file));
};
