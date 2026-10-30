import { getArrivalsInfo } from "server/navigation/arrivals";
import { getJourneyParamsForQuery } from "server/journey";
import { setCdnCacheHeaders } from "server/cache";

export default async (req, res) => {
    const { fromStationId, toStationId, day } = getJourneyParamsForQuery(req.query);
    if (fromStationId && toStationId && day) {
        const arrivals = getArrivalsInfo({ fromStationId, toStationId, day });
        setCdnCacheHeaders(res);
        res.status(200).json(arrivals);
        return;
    }
    res.status(500).end();
};
