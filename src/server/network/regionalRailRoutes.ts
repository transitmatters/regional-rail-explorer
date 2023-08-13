import {
    Station,
    Trip,
    SerializableRouteInfo,
    SerializableTrip,
    BranchMap,
    Route,
} from "../../types";
import { matchDayOfWeek } from "../../time";
import { isRegionalRailRouteId } from "routes";

const flatten = <T>(arr: T[][]): T[] => arr.reduce((a, b) => [...a, ...b], []);

const isRegionalRailTerminus = (stationId: string) =>
    stationId === "place-north" || stationId === "place-sstat";

const isWeekdayTrip = (trip: Trip) =>
    trip.serviceDays.some((day) => matchDayOfWeek(day, "weekday"));

const indexBy = <T extends Record<string, any>>(items: T[], key: keyof T) => {
    const index: Record<string, T[]> = {};
    items.forEach((item) => {
        const value = item[key];
        if (!index[value]) {
            index[value] = [];
        }
        index[value].push(item);
    });
    return index;
};

const serializeTrip = (trip: Trip): SerializableTrip => {
    const { directionId, routePatternId, stopTimes, id } = trip;
    return {
        id,
        directionId,
        routePatternId,
        stopTimes: stopTimes.map((stopTime) => {
            return {
                stationId: stopTime.stop.parentStation.id,
                time: stopTime.time,
            };
        }),
    };
};

const getStationIdsForRoutePatternIds = (tripMap: Record<string, SerializableTrip[]>) => {
    const stationIdsMap: Record<string, string[]> = {};
    for (const [routePatternId, trips] of Object.entries(tripMap)) {
        const exemplarTrip = trips
            .filter((trip) => isRegionalRailTerminus(trip.stopTimes[0].stationId))
            .reduce((best: null | SerializableTrip, next: SerializableTrip) => {
                if (!best || next.stopTimes.length > best!.stopTimes.length) {
                    return next;
                }
                return best;
            }, null);
        if (exemplarTrip) {
            stationIdsMap[routePatternId] = exemplarTrip.stopTimes.map((st) => st.stationId);
        }
    }
    return stationIdsMap;
};

const getBranchMap = (stationIdsByRoutePatternId: Record<string, string[]>): BranchMap => {
    const routePatternIds = Object.keys(stationIdsByRoutePatternId);
    const stationIdLists = Object.values(stationIdsByRoutePatternId);
    const collectedStationIds: string[] = [];
    let index = 0;
    while (true) {
        const idsAtIndex = stationIdLists.map((list) => list[index]).filter((x) => x);
        if (idsAtIndex.length === 0) {
            return {
                routePatternIds,
                stationIds: collectedStationIds,
            };
        } else {
            const uniqueIdsAtIndex = [...new Set(idsAtIndex)];
            if (uniqueIdsAtIndex.length > 1) {
                return {
                    routePatternIds,
                    stationIds: collectedStationIds,
                    branches: [...uniqueIdsAtIndex].map((stationId) => {
                        const remainingStationIdsByRoutePatternId: Record<string, string[]> = {};
                        const routePatternsMatchingId = routePatternIds.filter(
                            (id) => stationIdsByRoutePatternId[id][index] === stationId
                        );
                        routePatternsMatchingId.forEach((id) => {
                            remainingStationIdsByRoutePatternId[id] =
                                stationIdsByRoutePatternId[id].slice(index);
                        });
                        return getBranchMap(remainingStationIdsByRoutePatternId);
                    }),
                };
            } else {
                collectedStationIds.push(uniqueIdsAtIndex[0]);
                ++index;
            }
        }
    }
};

const getStationNamesMap = (stationIds: string[], stationMap: Record<string, Station>) => {
    const namesMap: Record<string, string> = {};
    stationIds.forEach((id) => {
        namesMap[id] = stationMap[id].name;
    });
    return namesMap;
};

const getRouteInfoFromTrips = (trips: Trip[], stationsById: Record<string, Station>) => {
    const weekdayTripsByRoutePatternId = indexBy(
        trips
            .filter(isWeekdayTrip)
            .map(serializeTrip)
            .sort((a, b) => a.stopTimes[0].time - b.stopTimes[0].time),
        "routePatternId"
    );
    const routePatternStations = getStationIdsForRoutePatternIds(weekdayTripsByRoutePatternId);
    return {
        branchMap: getBranchMap(routePatternStations),
        weekdayTrips: flatten(Object.values(weekdayTripsByRoutePatternId)),
        stationNames: getStationNamesMap(
            flatten(Object.values(routePatternStations)),
            stationsById
        ),
    };
};

export const getSerializedRouteInfoByRegionalRailRouteId = (
    trips: Trip[],
    stationsById: Record<string, Station>,
    routesById: Record<string, Route>
): Record<string, SerializableRouteInfo> => {
    const tripsByRouteId = indexBy(trips, "routeId");
    const routeInfoByRouteId: Record<string, SerializableRouteInfo> = {};
    for (const [routeId, trips] of Object.entries(tripsByRouteId)) {
        if (isRegionalRailRouteId(routeId)) {
            routeInfoByRouteId[routeId] = {
                ...routesById[routeId],
                ...getRouteInfoFromTrips(trips, stationsById),
            };
        }
    }
    return routeInfoByRouteId;
};
