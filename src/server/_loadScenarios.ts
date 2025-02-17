import fs from "fs";
import path from "path";

import { loadGtfsNetwork } from "./network";
import { stringify, parse } from "flatted";

const getGtfsFilePath = (networkName: string): string => {
    return path.resolve(process.cwd(), "data", networkName + ".tar.gz");
};

const getScenariosFilePath = () => {
    return path.resolve(process.cwd(), "scenarios.json");
};

export const loadScenariosFromFile = () => {
    return parse(fs.readFileSync("./scenarios.json", "utf8"));
};

const gtfsNetworksToRead = [
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

export const loadScenariosFromGtfs = () => {
    return gtfsNetworksToRead.map((networkDetails) => {
        return {
            id: networkDetails.id,
            name: networkDetails.name,
            unifiedFares: networkDetails.unifiedFares,
            network: loadGtfsNetwork(getGtfsFilePath(networkDetails.networkName)),
        };
    });
};

export const writeScenariosToFile = () => {
    const scenariosFileIsUpToDate = gtfsNetworksToRead.every((network) => {
        try {
            const gtfsFileStat = fs.statSync(getGtfsFilePath(network.networkName));
            const scenariosFileStat = fs.statSync(getScenariosFilePath());

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

    // Update scenarios.json if gtfs data has changed
    fs.writeFileSync(getScenariosFilePath(), stringify(loadScenariosFromGtfs()));
};
