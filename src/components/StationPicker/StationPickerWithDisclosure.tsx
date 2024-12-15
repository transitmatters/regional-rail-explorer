import React from "react";
import { GrDown, GrUp } from "react-icons/gr";

import { Button, StationsByLine } from "components";
import { StationPicker } from "components";
import { useAppContext } from "hooks";
import { Station } from "types";
import { useDisclosureStore } from "@ariakit/react";

interface StationPickerWithDisclosureProps {
    label: string;
    disabled?: boolean;
    lockBodyScroll?: boolean;
    onSelectStation: (stationId: string) => unknown;
    stationsByLine: StationsByLine;
    previouslySelectedStationId?: Station | null | string;
}

export const StationPickerWithDisclosure: React.FunctionComponent<
    StationPickerWithDisclosureProps
> = ({ label, disabled, ...restProps }) => {
    const { stationPickerDiscloseBelowElementRef } = useAppContext();
    const disclosure = useDisclosureStore({ defaultOpen: false });

    return (
        <StationPicker
            discloseBelowElementRef={stationPickerDiscloseBelowElementRef}
            disclosure={disclosure}
            render={(disclosureProps) => {
                const open = disclosure?.getState().open;
                return (
                    <Button
                        large
                        outline={open}
                        rightIcon={open ? <GrUp /> : <GrDown />}
                        {...disclosureProps}
                        disabled={disabled}
                    >
                        {label}
                    </Button>
                );
            }}
            {...(restProps as any)}
        ></StationPicker>
    );
};
