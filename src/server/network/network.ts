import {
    GtfsService,
    GtfsStop,
    GtfsStopTime,
    GtfsTrip,
    Indexed,
    Station,
    Stop,
    StopTime,
    Trip,
    Duration,
    Transfer,
    GtfsRoute,
    Route,
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
        routeIds: [],
        parentStation: parentStation,
    };
};

const createStation = (gtfsStop: GtfsStop): Station => {
    return {
        id: gtfsStop.stopId,
        name: gtfsStop.stopName,
        stops: [],
    };
};

const createTrip = (gtfsTrip: GtfsTrip, services: GtfsService[]): Trip => {
    const matchingService = services.find((service) => service.serviceId === gtfsTrip.serviceId);
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
    };
};

const createStopTime = (gtfsStopTime: GtfsStopTime, stop: Stop, trips: Indexed<Trip>): StopTime => {
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

const createTransfer = (fromStop: Stop, toStop: Stop, minWalkTime: Duration): Transfer => {
    if (fromStop && toStop) {
        return { fromStop, toStop, minWalkTime };
    }
    return null;
};

const createRoute = (gtfsRoute: GtfsRoute): Route => {
    return {
        id: gtfsRoute.routeId,
        name: gtfsRoute.routeLongName,
    };
};

export const buildNetworkFromGtfs = (loader: GtfsLoader) => {
    const gtfsServices = loader.services();
    const gtfsStops = loader.stops();
    const gtfsStopTimes = loader.relevantStopTimes();
    const gtfsTransfers = loader.transfers();
    const routes = loader.routes().map(createRoute);
    const trips = loader
        .trips()
        .map((trip) => createTrip(trip, gtfsServices))
        .filter((x) => x);
    const stations = gtfsStops.filter((stop) => stop.locationType === "1").map(createStation);
    const indexedTrips = index(trips, "id");
    const allStops = [];
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
                .filter((x) => x)
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
            stop.transfers = gtfsTransfers
                .filter((transfer) => transfer.fromStopId === stop.id)
                .map((transfer) =>
                    createTransfer(
                        stop,
                        allStops.find((stop) => stop.id === transfer.toStopId),
                        parseInt(transfer.minWalkTime)
                    )
                )
                .filter((x) => x);
            stop.serviceIds = [...new Set(stop.stopTimes.map((st) => st.trip.serviceId).flat())];
            stop.routeIds = [...new Set(stop.stopTimes.map((st) => st.trip.routeId).flat())];
        });
    });
    trips.forEach((trip) => trip.stopTimes.sort((a, b) => compareTimes(a.time, b.time)));
    const stationsById = index(stations, "id", true);
    const routesById = index(routes, "id", true);
    return {
        trips: indexedTrips,
        stationsById,
        stations: index(stations, "name", false),
        regionalRailRouteInfo: getSerializedRouteInfoByRegionalRailRouteId(
            trips,
            stationsById,
            routesById
        ),
    };
};
