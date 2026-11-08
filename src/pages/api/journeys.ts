import { setCdnCacheHeaders } from "server/cache";
import { getJourneyParamsForQuery, getJourneys } from "server/journey";

export default async (req, res) => {
    const { fromStationId, toStationId, day, time, navigationKind } = getJourneyParamsForQuery(
        req.query
    );
    if (fromStationId && toStationId && day && time && navigationKind) {
        const journeys = getJourneys({ fromStationId, toStationId, day, time, navigationKind });
        setCdnCacheHeaders(res);
        res.status(200).json(journeys);
        return;
    }
    res.status(500).end();
};
