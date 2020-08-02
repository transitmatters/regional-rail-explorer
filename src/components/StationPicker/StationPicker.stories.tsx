import React from "react";
import { action } from "@storybook/addon-actions";

import { stationsByLine } from "storydata/stationsByLine";

import StationPicker from "./StationPicker";

export default {
    title: "StationPicker",
    component: StationPicker,
};

export const Default = () => {
    return (
        <StationPicker stationsByLine={stationsByLine} onSelectStation={action("select-line")} />
    );
};
