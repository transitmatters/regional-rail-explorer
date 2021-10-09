import {
    Scenario,
    JourneyInfo,
    NetworkTime,
    NetworkDayKind,
    AmenityName,
    Journey,
    Station,
    CrowdingLevel,
    JourneyApiResult,
    JourneyTravelSegment,
} from "types";

import { navigate } from "server/navigation";
import { getStationsByIds } from "server/network";
import { getArrivalTimesForJourney } from "server/navigation/arrivals";
import { mapScenarios } from "server/scenarios";
import { HOUR, MINUTE } from "time";

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
                amenitiesByRoutePatternId?.[segment.routePatternId].levelBoarding
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
    fromStationId: string,
    toStationId: string,
    time: NetworkTime,
    day: NetworkDayKind,
    reverse: boolean
): JourneyInfo => {
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

export default async (req, res) => {
    const { fromStationId, toStationId, day, time, scenarioNames, reverse } = req.query;
    const journeys: JourneyApiResult = mapScenarios(
        scenarioNames.split(","),
        (scenario) =>
            getJourneyInfoForScenario(
                scenario,
                fromStationId,
                toStationId,
                parseInt(time, 10),
                day,
                reverse
            ),
        (_, scenario) => ({
            error: true,
            payload: { scenario: { name: scenario.name, id: scenario.id } },
        })
    );
    res.status(200).json(journeys);
};
