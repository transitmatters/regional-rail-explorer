import React from "react";

import { baselineInfo, enhancedInfo, journeyParams } from "storydata/journeyInfo";
import { baselineArrivals, enhancedArrivals } from "storydata/salem";

import Explorer from "./Explorer";

export default {
    title: "Explorer",
    component: Explorer,
};

export const Default = () => {
    return (
        <Explorer
            journeyParams={journeyParams}
            journeys={[baselineInfo, enhancedInfo]}
            arrivals={{ baselineArrivals, enhancedArrivals, showArrivals: true }}
        />
    );
};
