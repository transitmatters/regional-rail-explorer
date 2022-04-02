import { getJourneyParamsForQuery, getJourneys } from "server/journey";

export default async (req, res) => {
    const { fromStationId, toStationId, day, time, reverse } = getJourneyParamsForQuery(req.query);
    if (fromStationId && toStationId && day && time) {
        const journeys = getJourneys({ fromStationId, toStationId, day, time, reverse });
        res.status(200).json(journeys);
    }
    res.status(500).end();
};
