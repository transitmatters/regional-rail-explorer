import { parseTime } from "time";
import { getStationsByIds } from "server/network";
import { getArrivalTimesForJourney } from "server/navigation/arrivals";
import { navigate } from "server/navigation";
import { mapScenarios } from "server/scenarios";

export default async (req, res) => {
    const { scenarioNames, fromStationId, toStationId, day } = req.query;
    const scenarios = scenarioNames.split(",");
    const arrivals = mapScenarios(scenarios, ({ network }) => {
        const [fromStation, toStation] = getStationsByIds(network, fromStationId, toStationId);
        const exemplarJourney = navigate(fromStation, toStation, { time: parseTime("09:00"), day });
        const toStationIds = exemplarJourney
            .map((seg) => seg.type === "travel" && seg.toStation.id)
            .filter((x) => x);
        const toStations = getStationsByIds(network, ...toStationIds);
        return getArrivalTimesForJourney(fromStation, toStations, day);
    });
    res.status(200).json(arrivals);
};
