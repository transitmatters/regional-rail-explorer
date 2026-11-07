import React from "react";

import {
    baselineInfo,
    enhancedInfo,
    failedBaselineInfo,
    enhancedFromNewStationInfo,
} from "storydata/journeyInfo";

import JourneyComparison from "./JourneyComparison";

export default {
    title: "JourneyComparison",
    component: JourneyComparison,
};

export const Default = () => (
    <JourneyComparison baseline={baselineInfo} enhanced={enhancedInfo} departAfter={false} />
);

export const NoBaselineRoute = () => (
    <JourneyComparison baseline={failedBaselineInfo} enhanced={enhancedInfo} departAfter={false} />
);

export const NoBaselineRouteNewStation = () => (
    <JourneyComparison
        baseline={failedBaselineInfo}
        enhanced={enhancedFromNewStationInfo}
        departAfter={false}
    />
);
