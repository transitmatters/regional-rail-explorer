import React from "react";

import { stationsByLine, stationsById } from "stations";
import JourneyPicker from "./JourneyPicker";

export default {
    title: "JourneyPicker",
    component: JourneyPicker,
};

export const Default = () => {
    return (
        <JourneyPicker
            stationsByLine={stationsByLine}
            stationsById={stationsById}
            onSelectJourney={(j) => console.log(j)}
        />
    );
};
