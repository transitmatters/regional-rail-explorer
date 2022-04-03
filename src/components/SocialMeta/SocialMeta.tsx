import React from "react";

import { ParsedJourneyParams } from "types";
import { URLSearchParams } from "url";

type Props = {
    journeyParams: ParsedJourneyParams;
};

const getQueryStringForValidJourneyParams = (params: ParsedJourneyParams) => {
    const { fromStationId, toStationId, day, time, reverse } = params;
    if (fromStationId && toStationId && day && time) {
        const reversePart = reverse ? { reverse: "1" } : {};
        return new URLSearchParams({
            fromStationId,
            toStationId,
            day,
            time: time.toString(),
            ...reversePart,
        }).toString();
    }
    return null;
};

const SocialMeta = (props: Props) => {
    const { journeyParams } = props;
    const journeyQueryString = getQueryStringForValidJourneyParams(journeyParams);

    return (
        <>
            {journeyQueryString && (
                <meta
                    name="og:image"
                    content={`/api/summaryCard?${journeyQueryString}&format=png`}
                />
            )}
        </>
    );
};

export default SocialMeta;
