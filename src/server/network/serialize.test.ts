import { beforeAll, describe, expect, test } from "vitest";

import { NavigationKind, Network, NetworkDayKind, Station, Stop, Trip } from "types";
import { loadScenariosFromGtfs } from "server/_loadScenarios";
import { navigate } from "server/navigation";
import { getArrivalTimesForJourney } from "server/navigation/arrivals";

import { deserializeNetwork, serializeNetwork } from "./serialize";

// Builds each scenario's network from the GTFS archives in data/, round-trips it through the
// scenarios.json format, and checks the rebuilt network is the same graph and routes the same.

const HOUR = 60 * 60;

const STATION_IDS = [
    "place-sstat",
    "place-north",
    "place-WML-0442",
    "place-FB-0303",
    "place-ER-0362",
    "place-DB-2265",
    "place-FR-0253",
];

const DAY_TIMES: [NetworkDayKind, number][] = [
    ["weekday", 7.5 * HOUR],
    ["weekday", 17.25 * HOUR],
    ["saturday", 12 * HOUR],
];

const NAVIGATION_KINDS: NavigationKind[] = ["depart-at", "arrive-by", "depart-after"];

type Pair = { original: Network; rebuilt: Network; unifiedFares: boolean };

const networks: Record<string, Pair> = {};

// GTFS transfers with a blank min_transfer_time get a NaN walk time when the network is built.
// scenarios.json has always been JSON (via flatted before), which writes NaN as null, so null is
// what production routes with. Compare against that rather than the in-memory NaN.
const asWrittenToJson = (network: Network) => {
    Object.values(network.stationsById).forEach((station) =>
        station.stops.forEach((stop) =>
            stop.transfers.forEach((transfer) => {
                if (!Number.isFinite(transfer.walkTime)) {
                    transfer.walkTime = null as unknown as number;
                }
            })
        )
    );
    return network;
};

beforeAll(() => {
    loadScenariosFromGtfs().forEach((scenario) => {
        // Through a JSON string, as it is when written to and read from scenarios.json
        const serialized = JSON.parse(JSON.stringify(serializeNetwork(scenario.network)));
        networks[scenario.id] = {
            original: asWrittenToJson(scenario.network),
            rebuilt: deserializeNetwork(serialized),
            unifiedFares: scenario.unifiedFares,
        };
    });
});

const stopSignature = (stop: Stop) => ({
    id: stop.id,
    name: stop.name,
    description: stop.description,
    levelBoarding: stop.levelBoarding,
    serviceIds: stop.serviceIds,
    parentStationId: stop.parentStation.id,
    routes: stop.routes.map((route) => [route.id, route.name, route.routePatternIds]),
    stopTimes: stop.stopTimes.map((stopTime) => [stopTime.time, stopTime.trip.id]),
    transfers: stop.transfers.map((transfer) => [
        transfer.fromStop.id,
        transfer.toStop.id,
        transfer.walkTime,
    ]),
});

const tripSignature = (trip: Trip) => ({
    id: trip.id,
    serviceId: trip.serviceId,
    routeId: trip.routeId,
    routePatternId: trip.routePatternId,
    directionId: trip.directionId,
    serviceDays: trip.serviceDays,
    route: trip.route && [trip.route.id, trip.route.name, trip.route.routePatternIds],
    stopTimes: trip.stopTimes.map((stopTime) => [stopTime.time, stopTime.stop.id]),
});

const tripsWithStopTimes = (network: Network) =>
    Object.values(network.trips).filter((trip) => trip.stopTimes.length > 0);

const stationsToNavigate = (network: Network) =>
    STATION_IDS.map((id) => network.stationsById[id]).filter(
        (station): station is Station => !!station
    );

const navigateOrError = (network: Network, unifiedFares: boolean, options) => {
    const [fromStation, toStation] = [
        network.stationsById[options.fromStationId],
        network.stationsById[options.toStationId],
    ];
    try {
        return navigate({
            fromStation,
            toStation,
            initialDayTime: { day: options.day, time: options.time },
            navigationKind: options.navigationKind,
            unifiedFares,
        });
    } catch (error) {
        return { error: error.constructor.name };
    }
};

const forEachJourneyQuery = (
    network: Network,
    callback: (query: {
        fromStationId: string;
        toStationId: string;
        day: NetworkDayKind;
        time: number;
        navigationKind: NavigationKind;
    }) => void
) => {
    const stations = stationsToNavigate(network);
    stations.forEach((from) =>
        stations.forEach((to) => {
            if (from === to) return;
            DAY_TIMES.forEach(([day, time]) =>
                NAVIGATION_KINDS.forEach((navigationKind) =>
                    callback({
                        fromStationId: from.id,
                        toStationId: to.id,
                        day,
                        time,
                        navigationKind,
                    })
                )
            );
        })
    );
};

describe.each(["present", "regional_rail"])("%s scenario", (scenarioId) => {
    test("has the stations we navigate between", () => {
        const { original } = networks[scenarioId];
        expect(stationsToNavigate(original).length).toBeGreaterThanOrEqual(5);
    });

    test("rebuilds the same stations, stops and stop times", () => {
        const { original, rebuilt } = networks[scenarioId];
        expect(Object.keys(rebuilt.stationsById)).toEqual(Object.keys(original.stationsById));
        Object.values(original.stationsById).forEach((station) => {
            const rebuiltStation = rebuilt.stationsById[station.id];
            expect(rebuiltStation.name).toEqual(station.name);
            expect(rebuiltStation.stops.map(stopSignature)).toEqual(
                station.stops.map(stopSignature)
            );
        });
        const stationIdsByName = (network: Network) =>
            Object.fromEntries(Object.entries(network.stations).map(([name, s]) => [name, s.id]));
        expect(stationIdsByName(rebuilt)).toEqual(stationIdsByName(original));
    });

    test("rebuilds the same trips, keeping only those with stop times", () => {
        const { original, rebuilt } = networks[scenarioId];
        const originalTrips = tripsWithStopTimes(original);
        expect(Object.keys(rebuilt.trips).sort()).toEqual(originalTrips.map((t) => t.id).sort());
        originalTrips.forEach((trip) => {
            expect(tripSignature(rebuilt.trips[trip.id])).toEqual(tripSignature(trip));
        });
    });

    test("keeps amenities and route info", () => {
        const { original, rebuilt } = networks[scenarioId];
        expect(rebuilt.amenitiesByRoutePatternId).toEqual(original.amenitiesByRoutePatternId);
        expect(rebuilt.regionalRailRouteInfo).toEqual(original.regionalRailRouteInfo);
    });

    test("rebuilds a consistent graph", () => {
        const { rebuilt } = networks[scenarioId];
        const stationIds = new Set(Object.keys(rebuilt.stationsById));
        let stopTimesFromStops = 0;
        Object.values(rebuilt.stationsById).forEach((station) => {
            station.stops.forEach((stop) => {
                expect(stop.parentStation).toBe(station);
                expect(stop.stopTimes.length).toBeGreaterThan(0);
                stop.stopTimes.forEach((stopTime, index) => {
                    stopTimesFromStops++;
                    expect(stopTime.stop).toBe(stop);
                    // The same object is shared with the trip, not a copy
                    expect(stopTime.trip.stopTimes).toContain(stopTime);
                    expect(rebuilt.trips[stopTime.trip.id]).toBe(stopTime.trip);
                    if (index > 0) {
                        expect(stopTime.time).toBeGreaterThanOrEqual(
                            stop.stopTimes[index - 1].time
                        );
                    }
                });
                stop.transfers.forEach((transfer) => {
                    expect(transfer.fromStop).toBe(stop);
                    expect(stationIds.has(transfer.toStop.parentStation.id)).toBe(true);
                    // null is a blank min_transfer_time, see asWrittenToJson
                    if (transfer.walkTime !== null) {
                        expect(transfer.walkTime).toBeGreaterThanOrEqual(3 * 60);
                    }
                });
                const routesOfTrips = new Set(
                    stop.stopTimes.map((stopTime) => stopTime.trip.route)
                );
                expect(new Set(stop.routes)).toEqual(routesOfTrips);
            });
        });
        let stopTimesFromTrips = 0;
        Object.values(rebuilt.trips).forEach((trip) => {
            expect(trip.route?.id).toEqual(trip.routeId);
            trip.stopTimes.forEach((stopTime, index) => {
                stopTimesFromTrips++;
                expect(stopTime.trip).toBe(trip);
                expect(stopTime.stop.stopTimes).toContain(stopTime);
                if (index > 0) {
                    expect(stopTime.time).toBeGreaterThanOrEqual(trip.stopTimes[index - 1].time);
                }
            });
        });
        expect(stopTimesFromTrips).toEqual(stopTimesFromStops);
    });

    test("navigates to the same journeys", () => {
        const { original, rebuilt, unifiedFares } = networks[scenarioId];
        forEachJourneyQuery(original, (query) => {
            expect(navigateOrError(rebuilt, unifiedFares, query), JSON.stringify(query)).toEqual(
                navigateOrError(original, unifiedFares, query)
            );
        });
    });

    test("finds the same arrival times", () => {
        const { original, rebuilt } = networks[scenarioId];
        stationsToNavigate(original).forEach((from) =>
            stationsToNavigate(original).forEach((to) => {
                if (from === to) return;
                DAY_TIMES.forEach(([day]) => {
                    const arrivals = (network: Network) =>
                        getArrivalTimesForJourney(
                            network.stationsById[from.id],
                            [network.stationsById[to.id]],
                            day
                        );
                    expect(arrivals(rebuilt)).toEqual(arrivals(original));
                });
            })
        );
    });

    test("navigates to valid journeys", () => {
        const { rebuilt, unifiedFares } = networks[scenarioId];
        let queries = 0;
        let successes = 0;
        forEachJourneyQuery(rebuilt, (query) => {
            queries++;
            const journey = navigateOrError(rebuilt, unifiedFares, query);
            if (!Array.isArray(journey)) return;
            successes++;
            const context = JSON.stringify(query);
            expect(journey.length, context).toBeGreaterThan(0);
            journey.forEach((segment, index) => {
                expect(segment.endTime, context).toBeGreaterThanOrEqual(segment.startTime);
                if (index > 0) {
                    expect(segment.startTime, context).toBeGreaterThanOrEqual(
                        journey[index - 1].endTime
                    );
                }
            });
            const travelSegments = journey.filter((segment) => segment.kind === "travel");
            expect(travelSegments.length, context).toBeGreaterThan(0);
            expect(travelSegments[0].startStation.id, context).toEqual(query.fromStationId);
            expect(travelSegments[travelSegments.length - 1].endStation.id, context).toEqual(
                query.toStationId
            );
        });
        // These are busy stations at busy times, so nearly every query should find a journey
        expect(successes / queries).toBeGreaterThan(0.9);
    });
});
