import React from "react";
import useState from "storybook-addon-state";

import * as salem from "storydata/salem";
import { HOUR } from "time";

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
            spanFullDay={false}
            timePadding={HOUR / 2}
            onSelectTime={setTime}
            time={time}
        />
    );
};

export const Default = () => {
    return <StatefulDeparturePicker />;
};
