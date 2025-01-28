import React, { useRef, useEffect, useState, useCallback, ReactNode } from "react";
import {
    DisclosureProvider,
    Disclosure,
    DisclosureContent,
    DisclosureStore,
} from "@ariakit/react/disclosure";
import { RenderProp } from "reakit-utils/types";
import classNames from "classnames";

import { useAppContext, useLockBodyScroll, useViewport } from "hooks";
import { StationListing, StationsByLine } from "components";

import styles from "./StationPicker.module.scss";

type StationListingProps = React.ComponentProps<typeof StationListing>;

type StationPickerProps = {
    children?: ReactNode;
    lockBodyScroll?: boolean;
    onSelectStation: (stationId: string) => unknown;
    discloseBelowElementRef?: React.MutableRefObject<null | HTMLElement>;
    disclosure: DisclosureStore;
    render?: RenderProp | React.ReactElement;
} & StationListingProps;

const StationPicker: React.FunctionComponent<StationPickerProps> = ({
    onSelectStation,
    discloseBelowElementRef,
    lockBodyScroll = false,
    disclosure,
    render,
    ...stationListingProps
}) => {
    const [disclosureBounds, setDisclosureBounds] = useState<any>(null);
    const searchRef = useRef<null | HTMLInputElement>(null);
    const innerRef = useRef<null | HTMLDivElement>(null);

    const { viewportHeight } = useViewport();
    const { isMobile } = useAppContext();

    const handleSelectStation = useCallback(
        (stationId: string) => {
            onSelectStation(stationId);
            disclosure.setOpen(false);
        },
        [onSelectStation]
    );

    const updateDisclosureBounds = useCallback((el: HTMLElement, viewportHeight: number) => {
        const rect = el.getBoundingClientRect();
        const bottom = rect.bottom + window.scrollY;
        setDisclosureBounds({
            height: viewportHeight - bottom,
            top: bottom,
        });
    }, []);

    useEffect(() => {
        if (discloseBelowElementRef?.current && viewportHeight) {
            updateDisclosureBounds(discloseBelowElementRef.current, viewportHeight);
        }
    }, [discloseBelowElementRef?.current, viewportHeight]);

    useEffect(() => {
        if (disclosure.getState().open) {
            searchRef.current && searchRef.current.focus();

            const closeOnEscapeHandler = (evt: KeyboardEvent) => {
                if (evt.key === "Escape") {
                    disclosure.setOpen(false);
                }
            };

            const closeOnClickOutsideHandler = (evt: MouseEvent) => {
                const { current: inner } = innerRef;
                if (inner && !inner.contains(evt.target as Node)) {
                    disclosure.setOpen(false);
                }
            };

            window.addEventListener("keydown", closeOnEscapeHandler);
            window.addEventListener("click", closeOnClickOutsideHandler);

            return () => {
                window.removeEventListener("keydown", closeOnEscapeHandler);
                window.removeEventListener("click", closeOnClickOutsideHandler);
            };
        }
    }, [disclosure.getState().open]);

    useLockBodyScroll(lockBodyScroll && disclosure.getState().open);

    return (
        <div className={classNames("station-picker", styles.stationPicker)}>
            <DisclosureProvider store={disclosure}>
                <Disclosure render={render} />
                <DisclosureContent>
                    <div className={styles.inner} ref={innerRef} style={disclosureBounds}>
                        <StationListing
                            onClose={isMobile ? disclosure.toggle : null}
                            onSelectStation={handleSelectStation}
                            searchRef={searchRef}
                            {...stationListingProps}
                        />
                    </div>
                </DisclosureContent>
            </DisclosureProvider>
        </div>
    );
};

export default StationPicker;
export type { StationsByLine };
