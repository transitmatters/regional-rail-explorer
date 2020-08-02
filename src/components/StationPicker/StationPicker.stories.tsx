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
        <StationPicker stationsByLine={stationsByLine} onSelectStation={action("select-station")} />
    );
};

export const ExcludeColorLines = () => {
    return (
        <StationPicker
            stationsByLine={stationsByLine}
            onSelectStation={action("select-station")}
            excludeColorLines
        />
    );
};

export const HighlightLine = () => {
    return (
        <StationPicker
            stationsByLine={stationsByLine}
            onSelectStation={action("select-station")}
            previouslySelectedStationId="place-ER-0168"
        />
    );
};
