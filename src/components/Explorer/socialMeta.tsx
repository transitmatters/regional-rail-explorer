import React from "react";
import queryString from "query-string";

import { ParsedJourneyParams } from "types";
import { URLSearchParams } from "url";

type Props = {
    journeyParams: ParsedJourneyParams;
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

const getSocialMeta = (props: Props) => {
    const { journeyParams } = props;
    const journeyQueryString = getQueryStringForValidJourneyParams(journeyParams);
    return (
        <>
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:creator" content="@transitmatters" />
            <meta name="og:title" content="Test Title" />
            <meta name="og:description" content="Test Description" />
            {journeyQueryString && (
                <meta
                    name="og:image"
                    content={`/api/summaryCard?${journeyQueryString}&format=png`}
                />
            )}
        </>
    );
};

export default getSocialMeta;
