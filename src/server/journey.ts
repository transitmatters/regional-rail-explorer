import {
    Scenario,
    JourneyInfo,
    NetworkTime,
    NetworkDayKind,
    AmenityName,
    Journey,
    Station,
    CrowdingLevel,
    JourneyTravelSegment,
    JourneyParams,
    ParsedJourneyParams,
} from "types";

import { navigate } from "server/navigation";
import { getStationsByIds } from "server/network";
import { getArrivalTimesForJourney } from "server/navigation/arrivals";
import { mapScenarios } from "server/scenarios";
import { HOUR, MINUTE } from "time";

const omitUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
    const res: Partial<T> = {};
    Object.keys(obj).forEach((key) => {
        if (obj[key] !== undefined) {
            res[key as keyof T] = obj[key];
        }
    });
    return res;
};

const calculateAmenities = (scenario: Scenario, journey: Journey): AmenityName[] => {
    const {
        network: { amenitiesByRoutePatternId },
    } = scenario;
    const foundAmenties: AmenityName[] = [];
    const journeyHasLevelBoarding = journey
        .filter((segment): segment is JourneyTravelSegment => segment.kind === "travel")
        .every(
            (segment) =>
                segment.levelBoarding ||
                amenitiesByRoutePatternId?.[segment.routePatternId]?.levelBoarding
        );
    journey.forEach((segment) => {
        if (segment.kind === "travel") {
            const { routePatternId } = segment;
            const routePatternAmenities = amenitiesByRoutePatternId?.[routePatternId];
            if (routePatternAmenities) {
                const { electricTrains, increasedTopSpeed } = routePatternAmenities;
                if (electricTrains) {
                    foundAmenties.push("electricTrains");
                }
                if (increasedTopSpeed) {
                    foundAmenties.push("increasedTopSpeed");
                }
            }
        }
    });
    if (journeyHasLevelBoarding) {
        foundAmenties.push("levelBoarding");
    }
    return [...new Set(foundAmenties)];
};

const calculatePlatformCrowding = (
    calculateAt: { station: Station; arrivals: NetworkTime[]; time: NetworkTime }[]
) => {
    const crowding = {};
    calculateAt.forEach(({ station, arrivals, time }) => {
        const nextArrivalIndex = arrivals.findIndex((arr) => arr >= time);
        if (nextArrivalIndex !== -1 && nextArrivalIndex !== 0) {
            const previousArrival = arrivals[nextArrivalIndex - 1];
            const nextArrival = arrivals[nextArrivalIndex];
            const waitTimeMinutes = (nextArrival - previousArrival) / MINUTE;
            const isLongWait = waitTimeMinutes > 30;
            const timeInHours = time / HOUR;
            const isPeak =
                (timeInHours >= 8 && timeInHours <= 10.5) ||
                (timeInHours >= 16.5 && timeInHours <= 19.5);
            const crowdingLevel = isLongWait
                ? isPeak
                    ? CrowdingLevel.High
                    : CrowdingLevel.Medium
                : CrowdingLevel.Low;
            crowding[station.id] = {
                station: {
                    id: station.id,
                    name: station.name,
                },
                crowdingLevel,
            };
        }
    });
    return crowding;
};

const getJourneyInfoForScenario = (
    scenario: Scenario,
    journeyParams: JourneyParams
): JourneyInfo => {
    const { fromStationId, toStationId, time, day, reverse } = journeyParams;
    const { id, name, network, unifiedFares } = scenario;
    const [fromStation, toStation] = getStationsByIds(network, fromStationId, toStationId);
    const journey = navigate({
        fromStation,
        toStation,
        initialDayTime: { time, day },
        unifiedFares,
        reverse,
    });
    // TODO(ian): dedupe this nonsense from /api/arrivals
    const toStationIds = journey
        .map((seg) => seg.kind === "travel" && seg.endStation.id)
        .filter((x): x is string => !!x);
    const toStations = getStationsByIds(network, ...toStationIds);
    const arrivals = getArrivalTimesForJourney(fromStation, toStations, day);
    return {
        reverse,
        scenario: { id, name },
        segments: journey,
        amenities: calculateAmenities(scenario, journey),
        platformCrowding: calculatePlatformCrowding([
            { station: fromStation, arrivals: arrivals, time: time },
        ]),
        arrivals: {
            [fromStation.id]: {
                station: {
                    name: fromStation.name,
                    id: fromStation.id,
                },
                times: arrivals,
            },
        },
    };
};

export const getJourneys = (params: JourneyParams) => {
    return mapScenarios(
        (scenario) => getJourneyInfoForScenario(scenario, params),
        (_, scenario) => ({
            error: true,
            payload: { scenario: { name: scenario.name, id: scenario.id } },
        })
    );
};

export const getJourneyParamsForQuery = (
    query: Record<string, undefined | string>
): ParsedJourneyParams => {
    const { fromStationId, from, toStationId, to, day, time: timeString, reverse } = query;
    const time = parseInt(timeString || "", 10);
    return {
        ...omitUndefined({
            fromStationId: fromStationId || from,
            toStationId: toStationId || to,
            day: day as NetworkDayKind,
            time: Number.isFinite(time) ? time : undefined,
        }),
        reverse: !!reverse && reverse !== "0",
    };
};
