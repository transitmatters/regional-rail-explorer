import { getJourneyParamsForQuery, getJourneys } from "server/journey";

export default async (req, res) => {
    const { fromStationId, toStationId, day, time, navigationKind } = getJourneyParamsForQuery(
        req.query
    );
    if (fromStationId && toStationId && day && time && navigationKind) {
        const journeys = getJourneys({ fromStationId, toStationId, day, time, navigationKind });
        res.status(200).json(journeys);
    }
    res.status(500).end();
};
