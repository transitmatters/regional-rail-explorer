import ReactDOMServer from "react-dom/server";
import sharp from "sharp";

import { ParsedJourneyParams } from "types";
import { JourneySummaryCard } from "components";
import { getJourneys, getJourneyParamsForQuery } from "server/journey";

const getEnhancedJourney = (journeyParams: ParsedJourneyParams) => {
    const { fromStationId, toStationId, day, time, reverse } = journeyParams;
    if (fromStationId && toStationId && day && time) {
        const journeys = getJourneys({ fromStationId, toStationId, day, time, reverse });
        const enhancedJourney = journeys[1];
        if (!("error" in enhancedJourney)) {
            return enhancedJourney;
        }
    }
    return null;
};

const convertSvgToPng = (svg: string) => {
    const buffer = Buffer.from(svg);
    return sharp(buffer).resize(1600, 800).png().toBuffer();
};

export default async (req, res) => {
    const journeyParams = getJourneyParamsForQuery(req.query);
    const enhancedJourney = getEnhancedJourney(journeyParams);
    const { format } = req.query;
    if (enhancedJourney) {
        const cardString = ReactDOMServer.renderToString(
            <JourneySummaryCard journey={enhancedJourney} day={journeyParams.day!} />
        );
        const usePng = format === "png";
        res.status(200);
        if (usePng) {
            const buffer = await convertSvgToPng(cardString);
            res.setHeader("content-type", "image/png");
            res.send(buffer);
        } else {
            res.setHeader("content-type", "image/svg+xml");
            res.send(cardString);
        }
    } else {
        res.status(500).send("");
    }
};
