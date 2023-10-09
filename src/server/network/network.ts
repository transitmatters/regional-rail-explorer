import {
    Amenities,
    Duration,
    GtfsRoute,
    GtfsRoutePattern,
    GtfsRoutePatternAmenities,
    GtfsService,
    GtfsStop,
    GtfsStopTime,
    GtfsTrip,
    Indexed,
    Route,
    Station,
    Stop,
    StopTime,
    Transfer,
    Trip,
} from "types";
import { daysOfWeek, parseTime, compareTimes } from "time";

import { GtfsLoader } from "./load";
import { getSerializedRouteInfoByRegionalRailRouteId } from "./regionalRailRoutes";

const index = <T>(array: T[], key: string, validate = true): Indexed<T> => {
    const res = {};
    array.forEach((item) => {
        if (validate && res[item[key]]) {
            throw new Error(`Index failed due to duplicate key ${item[key]}`);
        }
        res[item[key]] = item;
    });
    return res;
};

const createStop = (gtfsStop: GtfsStop, parentStation: Station): Stop => {
    return {
        id: gtfsStop.stopId,
        name: gtfsStop.stopName,
        description: gtfsStop.stopDesc,
        stopTimes: [],
        transfers: [],
        serviceIds: [],
        routes: [],
        parentStation: parentStation,
        levelBoarding: gtfsStop.wheelchairBoarding === "1",
    };
};

const createStation = (gtfsStop: GtfsStop): Station => {
    if (gtfsStop.stopName === "Waltham") {
        console.log(gtfsStop);
    }
    return {
        id: gtfsStop.stopId,
        name: gtfsStop.stopName,
        stops: [],
        municipality: gtfsStop.municipality,
        latitude: gtfsStop.stopLat,
        longitude: gtfsStop.stopLon,
        address: gtfsStop.stopAddress,
    };
};

const createTrip = (
    gtfsTrip: GtfsTrip,
    services: GtfsService[],
    routesById: Record<string, Route>
): null | Trip => {
    const route = routesById[gtfsTrip.routeId];
    const matchingService = services.find((service) => service.serviceId === gtfsTrip.serviceId)!;
    const serviceDays = daysOfWeek.filter((day) => matchingService[day] === "1");
    if (serviceDays.length === 0) {
        // Throw out special services
        return null;
    }
    return {
        id: gtfsTrip.tripId,
        serviceId: gtfsTrip.serviceId,
        routeId: gtfsTrip.routeId,
        routePatternId: gtfsTrip.routePatternId,
        directionId: gtfsTrip.directionId,
        serviceDays,
        stopTimes: [],
        route,
    };
};

const createStopTime = (
    gtfsStopTime: GtfsStopTime,
    stop: Stop,
    trips: Indexed<null | Trip>
): null | StopTime => {
    const trip = trips[gtfsStopTime.tripId];
    if (!trip) {
        return null;
    }
    return {
        time: parseTime(gtfsStopTime.arrivalTime),
        stop,
        trip,
    };
};

const createTransfer = (fromStop: Stop, toStop: Stop, walkTime: Duration): null | Transfer => {
    if (fromStop && toStop) {
        return { fromStop, toStop, walkTime };
    }
    return null;
};

const createRoutes = (gtfsRoutes: GtfsRoute[], gtfsRoutePatterns: GtfsRoutePattern[]): Route[] => {
    const patternsByRouteId: Record<string, GtfsRoutePattern[]> = {};
    gtfsRoutePatterns.forEach((pattern) => {
        const patternsForRoute = patternsByRouteId[pattern.routeId] || [];
        patternsForRoute.push(pattern);
        patternsByRouteId[pattern.routeId] = patternsForRoute;
    });
    return gtfsRoutes.map((route) => {
        const patternsForRoute = patternsByRouteId[route.routeId];
        const routePatternIds = patternsForRoute?.map((pattern) => pattern.routePatternId) || [];
        return {
            id: route.routeId,
            name: route.routeLongName,
            routePatternIds,
        };
    });
};

const indexAmenities = (gtfsAmenities?: GtfsRoutePatternAmenities[]) => {
    if (gtfsAmenities) {
        const amenitiesByRoutePatternId: Record<string, Amenities> = {};
        gtfsAmenities.forEach(({ routePatternId, ...rest }) => {
            amenitiesByRoutePatternId[routePatternId] = rest;
        });
        return amenitiesByRoutePatternId;
    }
    return null;
};

export const buildNetworkFromGtfs = (loader: GtfsLoader) => {
    const gtfsServices = loader.services();
    const gtfsStops = loader.stops();
    const gtfsStopTimes = loader.relevantStopTimes();
    const gtfsTransfers = loader.transfers();
    const gtfsRoutes = loader.routes();
    const gtfsRoutePatterns = loader.routePatterns();
    const gtfsAmenities = loader.amenities?.();
    const routes = createRoutes(gtfsRoutes, gtfsRoutePatterns);
    const indexedRoutes = index(routes, "id");
    const trips = loader
        .trips()
        .map((trip) => createTrip(trip, gtfsServices, indexedRoutes))
        .filter((x): x is Trip => !!x);
    const stations = gtfsStops.filter((stop) => stop.locationType === "1").map(createStation);
    const indexedTrips = index(trips, "id");
    const allStops: Stop[] = [];
    console.log(`Loaded ${stations.length} stations from ${loader.basePath}`);
    stations.forEach((station) => {
        const childStops = gtfsStops.filter(
            (stop) => stop.parentStation === station.id && stop.locationType === "0"
        );
        childStops
            .map((gtfsStop) => createStop(gtfsStop, station))
            .forEach((stop) => station.stops.push(stop));
        station.stops.forEach((stop) => {
            const stopTimesHere = gtfsStopTimes
                .filter((time) => time.stopId === stop.id)
                .map((stopTime) => createStopTime(stopTime, stop, indexedTrips))
                .filter((x): x is StopTime => !!x)
                .sort((a, b) => compareTimes(a.time, b.time));
            stop.stopTimes = stopTimesHere;
            stopTimesHere.forEach((stopTime) =>
                indexedTrips[stopTime.trip.id].stopTimes.push(stopTime)
            );
        });
        station.stops = station.stops.filter((stop) => stop.stopTimes.length > 0);
        allStops.push(...station.stops);
    });
    stations.forEach((station) => {
        station.stops.forEach((stop) => {
            const gtfsDefinedTransfers = gtfsTransfers
                .filter((transfer) => transfer.fromStopId === stop.id)
                .map((transfer) =>
                    createTransfer(
                        stop,
                        allStops.find((stop) => stop.id === transfer.toStopId)!,
                        Math.max(3 * 60, parseInt(transfer.minTransferTime))
                    )
                );
            const transfersImpliedByParentStation = station.stops
                .filter((otherStop) => {
                    return !(
                        otherStop.id === stop.id ||
                        gtfsDefinedTransfers.some(
                            (tr) => tr?.fromStop.id === stop.id && tr?.toStop.id === otherStop.id
                        )
                    );
                })
                .map((otherStop) => createTransfer(stop, otherStop, 5 * 60));
            stop.transfers = [...gtfsDefinedTransfers, ...transfersImpliedByParentStation].filter(
                (x): x is Transfer => !!x
            );
            stop.serviceIds = [...new Set(stop.stopTimes.map((st) => st.trip.serviceId).flat())];
            stop.routes = [...new Set(stop.stopTimes.map((st) => st.trip.route).flat())];
        });
    });
    trips.forEach((trip) => trip.stopTimes.sort((a, b) => compareTimes(a.time, b.time)));
    const stationsById = index(stations, "id", true);
    return {
        trips: indexedTrips,
        stationsById,
        stations: index(stations, "name", false),
        amenitiesByRoutePatternId: indexAmenities(gtfsAmenities),
        regionalRailRouteInfo: getSerializedRouteInfoByRegionalRailRouteId(
            trips,
            stationsById,
            indexedRoutes
        ),
    };
};
