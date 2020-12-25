import {
    Scenario,
    JourneyInfo,
    NetworkTime,
    NetworkDayKind,
    Amenity,
    Journey,
    Station,
    CrowdingLevel,
} from "types";

import { navigate } from "server/navigation";
import { getStationsByIds } from "server/network";
import { getArrivalTimesForJourney } from "server/navigation/arrivals";
import { mapScenarios } from "server/scenarios";
import { HOUR, MINUTE } from "time";

const calculateAmenities = (scenario: Scenario, journey: Journey): Amenity[] => {
    const { amenitiesByRoute, amenitiesByStation } = scenario;
    const foundAmenties = [];
    journey.forEach((segment) => {
        if (segment.type === "travel") {
            const { fromStation, toStation, routeId } = segment;
            [fromStation, toStation].forEach((station) => {
                const stationAmenities = amenitiesByStation[station.id];
                if (stationAmenities) {
                    foundAmenties.push(...stationAmenities);
                }
            });
            const routeAmenities = amenitiesByRoute[routeId];
            if (routeAmenities) {
                foundAmenties.push(...routeAmenities);
            }
        }
    });
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
    day: NetworkDayKind
): JourneyInfo => {
    const { name, network } = scenario;
    const [fromStation, toStation] = getStationsByIds(network, fromStationId, toStationId);
    const journey = navigate(fromStation, toStation, { time, day });
    // TODO(ian): dedupe this nonsense from /api/arrivals
    const toStationIds = journey
        .map((seg) => seg.type === "travel" && seg.toStation.id)
        .filter((x) => x);
    const toStations = getStationsByIds(network, ...toStationIds);
    const arrivals = getArrivalTimesForJourney(fromStation, toStations, day);
    return {
        scenario: { name },
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
    const { fromStationId, toStationId, day, time, scenarioNames } = req.query;
    const journeys = mapScenarios(scenarioNames.split(","), (scenario) =>
        getJourneyInfoForScenario(scenario, fromStationId, toStationId, parseInt(time, 10), day)
    );
    res.status(200).json(journeys);
};
