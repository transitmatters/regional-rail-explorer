import React from "react";
import { action } from "@storybook/addon-actions";
import { GrDown } from "react-icons/gr";

import { stationsByLine } from "stations";
import Button from "components/Button/Button";

import StationPicker from "./StationPicker";
import { useDisclosureStore } from "@ariakit/react/disclosure";

export default {
    title: "StationPicker",
    component: StationPicker,
};

export const Default = () => {
    const disclosure = useDisclosureStore({ defaultOpen: false });
    return (
        <StationPicker
            stationsByLine={stationsByLine}
            onSelectStation={action("select-station")}
            disclosure={disclosure}
        >
            From...
        </StationPicker>
    );
};

export const WithCustomButton = () => {
    const disclosure = useDisclosureStore({ defaultOpen: false });
    return (
        <StationPicker
            stationsByLine={stationsByLine}
            onSelectStation={action("select-station")}
            disclosure={disclosure}
        >
            <Button large rightIcon={<GrDown />}>
                Choose a station...
            </Button>
        </StationPicker>
    );
};

export const ExcludeColorLines = () => {
    const disclosure = useDisclosureStore({ defaultOpen: false });
    return (
        <StationPicker
            stationsByLine={stationsByLine}
            onSelectStation={action("select-station")}
            excludeColorLines
            disclosure={disclosure}
        >
            To...
        </StationPicker>
    );
};

export const HighlightLine = () => {
    const disclosure = useDisclosureStore({ defaultOpen: false });
    return (
        <StationPicker
            stationsByLine={stationsByLine}
            onSelectStation={action("select-station")}
            previouslySelectedStationId="place-ER-0168"
            disclosure={disclosure}
        >
            To...
        </StationPicker>
    );
};
