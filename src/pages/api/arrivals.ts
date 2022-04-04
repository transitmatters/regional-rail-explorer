import { getArrivalTimes } from "server/navigation/arrivals";
import { getJourneyParamsForQuery } from "server/journey";

export default async (req, res) => {
    const { fromStationId, toStationId, day } = getJourneyParamsForQuery(req.query);
    if (fromStationId && toStationId && day) {
        const arrivals = getArrivalTimes({ fromStationId, toStationId, day });
        res.status(200).json(arrivals);
    }
    res.status(500).end();
};
