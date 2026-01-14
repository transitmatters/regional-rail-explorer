import React from "react";
import { GrDown, GrUp } from "react-icons/gr";

import { Button, StationsByLine } from "components";
import { StationPicker } from "components";
import { useAppContext } from "hooks";
import { Station } from "types";
import { DisclosureStore, useDisclosureStore } from "@ariakit/react";

interface StationPickerWithDisclosureProps {
    label: string;
    disabled?: boolean;
    lockBodyScroll?: boolean;
    onSelectStation: (stationId: string) => unknown;
    stationsByLine: StationsByLine;
    previouslySelectedStationId?: Station | null | string;
    disclosure?: DisclosureStore;
    onOpen?: () => void;
}

export const StationPickerWithDisclosure: React.FunctionComponent<
    StationPickerWithDisclosureProps
> = ({ label, disabled, disclosure: providedDisclosure, onOpen, ...restProps }) => {
    const { stationPickerDiscloseBelowElementRef } = useAppContext();
    const disclosure = providedDisclosure || useDisclosureStore({ defaultOpen: false });

    return (
        <StationPicker
            discloseBelowElementRef={stationPickerDiscloseBelowElementRef}
            disclosure={disclosure}
            render={(disclosureProps) => {
                const open = disclosure?.getState().open;
                const { onClick, ...restDisclosureProps } = disclosureProps;
                const handleClick = (event: React.MouseEvent) => {
                    if (!open) {
                        onOpen?.();
                    }
                    onClick?.(event);
                };
                return (
                    <Button
                        large
                        outline={open}
                        rightIcon={open ? <GrUp /> : <GrDown />}
                        {...restDisclosureProps}
                        onClick={handleClick}
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
