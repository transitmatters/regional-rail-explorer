import { getStationsByIds } from "server/network";
import { getStopTimesAtStation } from "server/navigationNew/arrivals";
import { mapScenarios } from "server/scenarios";
import { DepartureBoardEntry } from "types";

export default async (req, res) => {
    const { scenarioNames, stationId, day } = req.query;
    const scenarios = scenarioNames.split(",");
    const board: DepartureBoardEntry[][] = mapScenarios(scenarios, ({ network }) => {
        const [station] = getStationsByIds(network, stationId);
        return getStopTimesAtStation(station, day)
            .map((stopTime) => {
                const finalStopTime = stopTime.trip.stopTimes[stopTime.trip.stopTimes.length - 1];
                const destination = finalStopTime.stop.parentStation;
                return {
                    time: stopTime.time,
                    routeId: stopTime.trip.routeId,
                    serviceId: stopTime.trip.serviceId,
                    destination: {
                        id: destination.id,
                        name: destination.name,
                    },
                };
            })
            .sort((a, b) => a.time - b.time);
    });
    res.status(200).json(board);
};
