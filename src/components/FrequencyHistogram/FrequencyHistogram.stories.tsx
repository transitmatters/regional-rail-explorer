import * as React from "react";

import * as salem from "storydata/salem";

import FrequencyHistogram from "./FrequencyHistogram";

export default {
    title: "FrequencyHistogram",
    component: FrequencyHistogram,
};

export const Default = () => {
    return (
        <FrequencyHistogram
            enhancedArrivals={salem.enhancedArrivals}
            baselineArrivals={salem.baselineArrivals}
        />
    );
};
