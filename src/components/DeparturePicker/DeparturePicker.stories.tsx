import React from "react";

import * as salem from "storydata/salem";

import DeparturePicker from "./DeparturePicker";
import { useStorybookState } from "hooks";

export default {
    title: "DeparturePicker",
    component: DeparturePicker,
};

const StatefulDeparturePicker = () => {
    const [time, setTime] = useStorybookState("time", 9 * 3600);
    return (
        <DeparturePicker
            enhancedArrivals={salem.enhancedArrivals}
            baselineArrivals={salem.baselineArrivals}
            onSelectTime={setTime}
            time={time}
            timeRange={[0, 24 * 3600 - 1]}
        />
    );
};

export const Default = () => {
    return <StatefulDeparturePicker />;
};
