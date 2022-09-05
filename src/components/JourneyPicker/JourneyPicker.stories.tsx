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
            navigationKind="depart-at"
            stationsByLine={stationsByLine}
            stationsById={stationsById}
            updateJourneyParams={(j) => void j}
            onSelectDay={(d) => void d}
            onSelectTimeOfDay={(t) => void t}
            day="weekday"
            time={null}
            timeRange={[0, 24 * 3600 - 1]}
        />
    );
};
