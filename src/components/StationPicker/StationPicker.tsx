import React, { useRef, useEffect, useState, useCallback, ReactNode } from "react";
import { Disclosure, DisclosureContent, useDisclosureState } from "reakit";

import StationListing, { StationsByLine } from "components/StationListing/StationListing";

import styles from "./StationPicker.module.scss";

type Props = {
    children?: ReactNode;
    lockBodyScroll?: boolean;
} & React.ComponentProps<typeof StationListing>;

const StationPicker = (props: Props) => {
    const { children, onSelectStation, lockBodyScroll, ...stationListingProps } = props;
    const [disclosureBounds, setDisclosureBounds] = useState(null);
    const searchRef = useRef<HTMLInputElement>();
    const innerRef = useRef<HTMLDivElement>();
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

    const updateDisclosureBounds = (el) => {
        if (el && !disclosureBounds) {
            const rect = el.getBoundingClientRect();
            setDisclosureBounds({
                bottom: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    };

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
                style={disclosureBounds && { height: window.innerHeight - disclosureBounds.bottom }}
            >
                <div
                    className={styles.triangle}
                    style={
                        disclosureBounds && {
                            marginLeft: disclosureBounds.left + disclosureBounds.width / 2,
                        }
                    }
                />
                <StationListing
                    onSelectStation={handleSelectStation}
                    searchRef={searchRef}
                    {...stationListingProps}
                />
            </div>
        );
    };

    return (
        <div className={styles.stationPicker}>
            <Disclosure {...disclosure} ref={updateDisclosureBounds}>
                {children}
            </Disclosure>
            <DisclosureContent {...disclosure}>{renderDisclosureContent()}</DisclosureContent>
        </div>
    );
};

export default StationPicker;
export type { StationsByLine };
