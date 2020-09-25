import { Scenario, JourneyInfo, NetworkTime, NetworkDayKind, Amenity, Journey } from "types";

import { navigate } from "server/navigation";
import { getStationsByIds } from "server/network";
import { getArrivals } from "server/navigation/arrivals";
import { mapScenarios } from "server/scenarios";

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
    const arrivals = getArrivals(fromStation, toStations, day);
    return {
        scenario: { name },
        segments: journey,
        amenities: calculateAmenities(scenario, journey),
        platformCrowding: {},
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
