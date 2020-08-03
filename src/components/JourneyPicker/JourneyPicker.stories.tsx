import React from "react";

import { stationsByLine } from "storydata/stationsByLine";
import JourneyPicker from "./JourneyPicker";

export default {
    title: "JourneyPicker",
    component: JourneyPicker,
};

export const Default = () => {
    return <JourneyPicker stationsByLine={stationsByLine} />;
};
