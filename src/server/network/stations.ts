import { Station } from "types";

export const getStationInfo = (station: Station) => {
    return {
        id: station.id,
        name: station.name,
        municipality: station.municipality,
    };
};
