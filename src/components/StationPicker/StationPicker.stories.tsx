import React from "react";
import { action } from "@storybook/addon-actions";
import { GrDown } from "react-icons/gr";

import { stationsByLine } from "stations";
import Button from "components/Button/Button";

import StationPicker from "./StationPicker";

export default {
    title: "StationPicker",
    component: StationPicker,
};

export const Default = () => {
    return (
        <StationPicker stationsByLine={stationsByLine} onSelectStation={action("select-station")}>
            From...
        </StationPicker>
    );
};

export const WithCustomButton = () => {
    return (
        <StationPicker stationsByLine={stationsByLine} onSelectStation={action("select-station")}>
            {(discProps) => (
                <Button {...discProps} large rightIcon={<GrDown />}>
                    Choose a station...
                </Button>
            )}
        </StationPicker>
    );
};

export const ExcludeColorLines = () => {
    return (
        <StationPicker
            stationsByLine={stationsByLine}
            onSelectStation={action("select-station")}
            excludeColorLines
        >
            To...
        </StationPicker>
    );
};

export const HighlightLine = () => {
    return (
        <StationPicker
            stationsByLine={stationsByLine}
            onSelectStation={action("select-station")}
            previouslySelectedStationId="place-ER-0168"
        >
            To...
        </StationPicker>
    );
};
