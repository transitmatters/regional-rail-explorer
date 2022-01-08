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
            fromStationId={null}
            toStationId={null}
            reverse={false}
            stationsByLine={stationsByLine}
            stationsById={stationsById}
            onSelectJourney={(j) => void j}
            onSelectDay={(d) => void d}
            onSelectTimeOfDay={(t) => void t}
            day="weekday"
            time={null}
            timeRange={[0, 24 * 3600 - 1]}
        />
    );
};
