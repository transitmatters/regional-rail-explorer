import ReactDOMServer from "react-dom/server";
import sharp from "sharp";
import queryString from "query-string";

import { ParsedJourneyParams } from "types";
import { JourneySummaryCard } from "components";
import { getJourneyParamsForQuery, getSuccessfulJourneys } from "server/journey";

const getJourneyInfoForParams = (journeyParams: ParsedJourneyParams) => {
    const { fromStationId, toStationId, day, time, navigationKind } = journeyParams;
    if (fromStationId && toStationId && day && time && navigationKind) {
        return getSuccessfulJourneys({ fromStationId, toStationId, day, time, navigationKind });
    }
    return null;
};

const convertSvgToPng = (svg: string) => {
    const buffer = Buffer.from(svg);
    return sharp(buffer).resize(1600, 800).png().toBuffer();
};

const getRawJourneyParams = (query: Record<string, any>) => {
    const { encodedUrlParams, ...rest } = query;
    if (encodedUrlParams && encodedUrlParams !== "useQuery") {
        const decoded = atob(encodedUrlParams);
        return queryString.parse(decoded);
    }
    return rest;
};

export default async (req, res) => {
    const rawJourneyParams = getRawJourneyParams(req.query);
    const journeyParams = getJourneyParamsForQuery(rawJourneyParams);
    const journeys = getJourneyInfoForParams(journeyParams);
    const { format } = req.query;
    if (journeys) {
        const [baseline, enhanced] = journeys;
        const cardString = ReactDOMServer.renderToString(
            <JourneySummaryCard baseline={baseline} enhanced={enhanced} day={journeyParams.day!} />
        );
        const useSvg = format === "svg";
        res.status(200);
        if (useSvg) {
            res.setHeader("content-type", "image/svg+xml");
            res.send(cardString);
        } else {
            const buffer = await convertSvgToPng(cardString);
            res.setHeader("content-type", "image/png");
            res.send(buffer);
        }
    } else {
        res.status(500).send("");
    }
};
