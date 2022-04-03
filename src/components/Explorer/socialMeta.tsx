import React from "react";
import queryString from "query-string";

import { JourneyInfo, ParsedJourneyParams, JourneyTravelSegment } from "types";

type Props = {
    journeyParams: ParsedJourneyParams;
    journeys: null | JourneyInfo[];
};

const getQueryStringForValidJourneyParams = (params: ParsedJourneyParams) => {
    const { fromStationId, toStationId, day, time, reverse } = params;
    if (fromStationId && toStationId && day && time) {
        const reversePart = reverse ? { reverse: "1" } : {};
        return queryString.stringify({
            fromStationId,
            toStationId,
            day,
            time: time.toString(),
            ...reversePart,
        });
    }
    return null;
};

const getTitle = (journey: JourneyInfo) => {
    const travelSegments = journey.segments.filter(
        (x): x is JourneyTravelSegment => x.kind === "travel"
    );
    const first = travelSegments[0].startStation.name;
    const last = travelSegments[travelSegments.length - 1].endStation.name;
    return `Regional Rail Explorer | Trip from ${first} to ${last}`;
};

const getSocialMeta = (props: Props) => {
    const { journeyParams, journeys } = props;
    const enhanced = journeys && journeys[1];
    const title = enhanced && getTitle(enhanced);
    const journeyQueryString = getQueryStringForValidJourneyParams(journeyParams);
    const journeyImage =
        journeyQueryString &&
        `https://regionalrail.rocks/api/summaryCard/${btoa(journeyQueryString)}`;
    return (
        <>
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:creator" content="@transitmatters" />
            {title && <meta name="og:title" content={title} />}
            {journeyImage && <meta name="og:image" content={journeyImage} />}
            {journeyImage && <meta name="twitter:image" content={journeyImage} />}
        </>
    );
};

export default getSocialMeta;
