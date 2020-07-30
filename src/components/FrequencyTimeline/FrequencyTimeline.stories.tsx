import * as React from "react";

import { DAY } from "time";
import * as salem from "storydata/salem";

import FrequencyTimeline from "./FrequencyTimeline";

export default {
    title: "FrequencyTimeline",
    component: FrequencyTimeline,
};

export const Default = () => {
    return (
        <FrequencyTimeline
            timeRange={[0, DAY]}
            enhancedArrivals={salem.enhancedArrivals}
            baselineArrivals={salem.baselineArrivals}
        />
    );
};
