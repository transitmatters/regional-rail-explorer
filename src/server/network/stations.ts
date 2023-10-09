import { Station } from "types";

export const getStationInfo = (station: Station) => {
    return {
        id: station.id,
        name: station.name,
        municipality: station.municipality,
        latitude: station.latitude,
        longitude: station.longitude,
        address: station.address,
        stops: station.stops.map((stop) =>
            stop.stopTimes.map((stopTime) => ({
                time: stopTime.time,
                directionId: stopTime.trip.directionId,
                route: stopTime.trip.route,
            }))
        ),
    };
};
