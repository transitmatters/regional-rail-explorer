import { Network } from "types";
import { createGtfsLoader } from "./load";
import { buildNetworkFromGtfs } from "./network";

export const loadGtfsNetwork = (archivePath: string) => {
    const loader = createGtfsLoader(archivePath);
    return buildNetworkFromGtfs(loader);
};

export const getStationsByIds = (network: Network, ...stationIds: string[]) => {
    return stationIds.map((id) => {
        if (network.stationsById[id]) {
            return network.stationsById[id];
        }
        throw new Error(`No station by id ${id}`);
    });
};
