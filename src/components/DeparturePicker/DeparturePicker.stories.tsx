import * as React from "react";
import { action } from "@storybook/addon-actions";

import * as salem from "storydata/salem";

import DeparturePicker from "./DeparturePicker";
import { HOUR } from "time";

export default {
    title: "DeparturePicker",
    component: DeparturePicker,
};

export const Default = () => {
    return (
        <DeparturePicker
            enhancedArrivals={salem.enhancedArrivals}
            baselineArrivals={salem.baselineArrivals}
            spanFullDay={false}
            timePadding={HOUR / 2}
            onSelectTime={action("select-time")}
            onUpdateTime={() => {}}
        />
    );
};
