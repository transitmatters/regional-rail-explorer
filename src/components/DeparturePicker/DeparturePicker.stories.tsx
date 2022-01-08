import React from "react";
import useState from "storybook-addon-state";

import * as salem from "storydata/salem";

import DeparturePicker from "./DeparturePicker";

export default {
    title: "DeparturePicker",
    component: DeparturePicker,
};

const StatefulDeparturePicker = () => {
    const [time, setTime] = useState("time", 9 * 3600);
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
