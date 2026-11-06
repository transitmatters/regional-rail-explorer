import React from "react";
import queryString from "query-string";

import { getJourneyEndpoints } from "journeys";
import { stringifyDuration } from "time";
import { JourneyInfo, ParsedJourneyParams } from "types";

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

const getJourneyDuration = (journey: JourneyInfo) => {
    const { segments } = journey;
    return segments[segments.length - 1].endTime - segments[0].startTime;
};

const getDescription = (journey: JourneyInfo) => {
    if (journey.navigationFailed) {
        return null;
    }
    const { startStation, endStation } = getJourneyEndpoints(journey.segments);
    const duration = getJourneyDuration(journey);
    const durationString = stringifyDuration(duration, true);
    return `Trip from ${startStation.name} to ${endStation.name} in ${durationString}`;
};

const getSocialMeta: React.FunctionComponent<Props> = (props) => {
    const { journeyParams, journeys } = props;
    const enhanced = journeys && journeys[1];
    const description = enhanced && getDescription(enhanced);
    const journeyQueryString = getQueryStringForValidJourneyParams(journeyParams);
    const journeyImage =
        journeyQueryString &&
        `https://regionalrail.rocks/api/summaryCard/${btoa(journeyQueryString)}`;
    return (
        <>
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:creator" content="@transitmatters" />
            <meta name="og:title" content="TransitMatters | Regional Rail Explorer" />
            {description && <meta name="og:description" content={description} />}
            {journeyImage && <meta name="og:image" content={journeyImage} />}
            {journeyImage && <meta name="twitter:image" content={journeyImage} />}
        </>
    );
};

export default getSocialMeta;
