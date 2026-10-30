import {
    Amenities,
    Indexed,
    Network,
    NetworkDay,
    Route,
    Scenario,
    SerializableRouteInfo,
    Station,
    Stop,
    StopTime,
    Trip,
} from "types";

// The network is a cyclic object graph (stops <-> stop times <-> trips). We used to write it
// with flatted, but reviving ~1M flatted entries needed more than 256MB of heap at once. Instead
// we write flat tables whose cross-references are array indices, then rebuild the same graph.

type SerializedRoute = [id: string, name: string, routePatternIds: string[]];

type SerializedTrip = [
    id: string,
    serviceId: string,
    routeId: string,
    routePatternId: string,
    directionId: string,
    serviceDays: NetworkDay[],
    // Indices into the network-wide list of stop times, in this trip's order
    stopTimes: number[],
];

type SerializedStop = {
    id: string;
    name: string;
    description: string;
    levelBoarding: boolean;
    serviceIds: string[];
    routeIds: string[];
    // Flattened [time, tripIndex] pairs, in this stop's order
    stopTimes: number[];
    // Flattened [toStopIndex, walkTime] pairs
    transfers: number[];
};

type SerializedStation = {
    id: string;
    name: string;
    stops: SerializedStop[];
};

export type SerializedNetwork = {
    routes: SerializedRoute[];
    trips: SerializedTrip[];
    stations: SerializedStation[];
    stationIndexByName: Record<string, number>;
    amenitiesByRoutePatternId: null | Record<string, Amenities>;
    regionalRailRouteInfo: Record<string, SerializableRouteInfo>;
};

// Bump when the format changes, so builds regenerate a stale scenarios.json
export const SCENARIOS_FILE_VERSION = 2;

export type ScenariosFile = {
    version: number;
    scenarios: (Omit<Scenario, "network"> & { network: SerializedNetwork })[];
};

export const serializeNetwork = (network: Network): SerializedNetwork => {
    const stations = Object.values(network.stationsById);
    const stopIndices = new Map<Stop, number>();
    const stopTimeIndices = new Map<StopTime, number>();
    const tripIndices = new Map<Trip, number>();
    const trips: Trip[] = [];
    const routes = new Map<string, Route>();

    stations.forEach((station) =>
        station.stops.forEach((stop) => {
            stopIndices.set(stop, stopIndices.size);
            stop.stopTimes.forEach((stopTime) => {
                stopTimeIndices.set(stopTime, stopTimeIndices.size);
                if (!tripIndices.has(stopTime.trip)) {
                    tripIndices.set(stopTime.trip, trips.length);
                    trips.push(stopTime.trip);
                }
            });
            stop.routes.forEach((route) => routes.set(route.id, route));
        })
    );
    trips.forEach((trip) => trip.route && routes.set(trip.route.id, trip.route));

    const stationIndices = new Map(stations.map((station, index) => [station, index]));
    const stationIndexByName: Record<string, number> = {};
    Object.entries(network.stations).forEach(([name, station]) => {
        stationIndexByName[name] = stationIndices.get(station)!;
    });

    return {
        routes: [...routes.values()].map((route) => [route.id, route.name, route.routePatternIds]),
        trips: trips.map((trip) => [
            trip.id,
            trip.serviceId,
            trip.routeId,
            trip.routePatternId,
            trip.directionId,
            trip.serviceDays,
            trip.stopTimes.map((stopTime) => stopTimeIndices.get(stopTime)!),
        ]),
        stations: stations.map((station) => ({
            id: station.id,
            name: station.name,
            stops: station.stops.map((stop) => ({
                id: stop.id,
                name: stop.name,
                description: stop.description,
                levelBoarding: stop.levelBoarding,
                serviceIds: stop.serviceIds,
                routeIds: stop.routes.map((route) => route.id),
                stopTimes: stop.stopTimes.flatMap((stopTime) => [
                    stopTime.time,
                    tripIndices.get(stopTime.trip)!,
                ]),
                transfers: stop.transfers.flatMap((transfer) => [
                    stopIndices.get(transfer.toStop)!,
                    transfer.walkTime,
                ]),
            })),
        })),
        stationIndexByName,
        amenitiesByRoutePatternId: network.amenitiesByRoutePatternId,
        regionalRailRouteInfo: network.regionalRailRouteInfo,
    };
};

export const deserializeNetwork = (serialized: SerializedNetwork): Network => {
    const routesById: Indexed<Route> = {};
    serialized.routes.forEach(([id, name, routePatternIds]) => {
        routesById[id] = { id, name, routePatternIds };
    });

    const trips: Trip[] = serialized.trips.map(
        ([id, serviceId, routeId, routePatternId, directionId, serviceDays]) => ({
            id,
            serviceId,
            routeId,
            routePatternId,
            directionId,
            serviceDays,
            stopTimes: [],
            route: routesById[routeId],
        })
    );

    const allStops: Stop[] = [];
    const allStopTimes: StopTime[] = [];
    const stations: Station[] = serialized.stations.map((serializedStation) => {
        const station: Station = {
            id: serializedStation.id,
            name: serializedStation.name,
            stops: [],
        };
        station.stops = serializedStation.stops.map((serializedStop) => {
            const stop: Stop = {
                id: serializedStop.id,
                name: serializedStop.name,
                description: serializedStop.description,
                stopTimes: [],
                transfers: [],
                serviceIds: serializedStop.serviceIds,
                routes: serializedStop.routeIds.map((routeId) => routesById[routeId]),
                parentStation: station,
                levelBoarding: serializedStop.levelBoarding,
            };
            const times = serializedStop.stopTimes;
            for (let i = 0; i < times.length; i += 2) {
                const stopTime: StopTime = { time: times[i], stop, trip: trips[times[i + 1]] };
                stop.stopTimes.push(stopTime);
                allStopTimes.push(stopTime);
            }
            allStops.push(stop);
            return stop;
        });
        return station;
    });

    let stopIndex = 0;
    serialized.stations.forEach((serializedStation) =>
        serializedStation.stops.forEach((serializedStop) => {
            const fromStop = allStops[stopIndex++];
            const pairs = serializedStop.transfers;
            for (let i = 0; i < pairs.length; i += 2) {
                fromStop.transfers.push({
                    fromStop,
                    toStop: allStops[pairs[i]],
                    walkTime: pairs[i + 1],
                });
            }
        })
    );

    serialized.trips.forEach((serializedTrip, index) => {
        trips[index].stopTimes = serializedTrip[6].map(
            (stopTimeIndex) => allStopTimes[stopTimeIndex]
        );
    });

    const stationsById: Indexed<Station> = {};
    stations.forEach((station) => {
        stationsById[station.id] = station;
    });
    const stationsByName: Indexed<Station> = {};
    Object.entries(serialized.stationIndexByName).forEach(([name, index]) => {
        stationsByName[name] = stations[index];
    });
    const tripsById: Indexed<Trip> = {};
    trips.forEach((trip) => {
        tripsById[trip.id] = trip;
    });

    return {
        // Only trips that have stop times; nothing at runtime looks up the others
        trips: tripsById,
        stationsById,
        stations: stationsByName,
        amenitiesByRoutePatternId: serialized.amenitiesByRoutePatternId,
        regionalRailRouteInfo: serialized.regionalRailRouteInfo,
    };
};
