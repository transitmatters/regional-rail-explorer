import React, { useRef, useEffect, useState, useCallback, ReactNode } from "react";
import { Disclosure, DisclosureContent, useDisclosureState } from "reakit";
import classNames from "classnames";

import StationListing, { StationsByLine } from "components/StationListing/StationListing";

import styles from "./StationPicker.module.scss";

type StationListingProps = React.ComponentProps<typeof StationListing>;

type Props = {
    children?: ReactNode;
    lockBodyScroll?: boolean;
    onSelectStation: Exclude<StationListingProps["onSelectStation"], undefined>;
    discloseBelowElement: HTMLElement;
} & StationListingProps;

const StationPicker = (props: Props) => {
    const {
        children,
        onSelectStation,
        lockBodyScroll,
        discloseBelowElement,
        ...stationListingProps
    } = props;
    const [disclosureBounds, setDisclosureBounds] = useState<any>(null);
    const searchRef = useRef<null | HTMLInputElement>(null);
    const innerRef = useRef<null | HTMLDivElement>(null);
    const disclosure = useDisclosureState({ visible: false });
    // Using data-station-id instead of generating a closure for each station's callback is a
    // performance enhancement recommended by Reakit when using a Composite with many items.
    const handleSelectStation = useCallback(
        (stationId: string) => {
            onSelectStation(stationId);
            disclosure.setVisible(false);
        },
        [onSelectStation]
    );

    const updateDisclosureBounds = useCallback((el) => {
        if (el) {
            const rect = el.getBoundingClientRect();
            setDisclosureBounds({
                bottom: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, []);

    useEffect(() => {
        updateDisclosureBounds(discloseBelowElement);
    }, [discloseBelowElement]);

    useEffect(() => {
        if (disclosure.visible) {
            searchRef.current && searchRef.current.focus();

            const closeOnEscapeHandler = (evt: KeyboardEvent) => {
                if (evt.key === "Escape") {
                    disclosure.setVisible(false);
                }
            };

            const closeOnClickOutsideHandler = (evt: MouseEvent) => {
                const { current: inner } = innerRef;
                if (inner && !inner.contains(evt.target as Node)) {
                    disclosure.setVisible(false);
                }
            };

            window.addEventListener("keydown", closeOnEscapeHandler);
            window.addEventListener("click", closeOnClickOutsideHandler);

            return () => {
                window.removeEventListener("keydown", closeOnEscapeHandler);
                window.removeEventListener("click", closeOnClickOutsideHandler);
            };
        }
    }, [disclosure.visible]);

    useEffect(() => {
        if (lockBodyScroll && disclosure.visible) {
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "initial";
            };
        }
    }, [lockBodyScroll, disclosure.visible]);

    const renderDisclosureContent = () => {
        return (
            <div
                className={styles.inner}
                ref={innerRef}
                style={
                    disclosureBounds && {
                        height: window.innerHeight - disclosureBounds.bottom,
                        bottom: 0,
                    }
                }
            >
                <StationListing
                    onSelectStation={handleSelectStation}
                    searchRef={searchRef}
                    {...stationListingProps}
                />
            </div>
        );
    };

    return (
        <div className={classNames("station-picker", styles.stationPicker)}>
            <Disclosure {...disclosure}>{children}</Disclosure>
            <DisclosureContent {...disclosure}>{renderDisclosureContent()}</DisclosureContent>
        </div>
    );
};

export default StationPicker;
export type { StationsByLine };
