import React, { useRef, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import classNames from "classnames";

import {
    Disclosure,
    DisclosureContent,
    Composite,
    CompositeItem,
    useDisclosureState,
    useCompositeState,
} from "reakit";

import styles from "./StationPicker.module.scss";

type Station = { id: string; name: string };
export type StationsByLine = { [line: string]: Station[] };

interface Props {
    children?: ReactNode;
    stationsByLine: StationsByLine;
    onSelectStation: (stationId: string) => any;
    excludeColorLines?: boolean;
    previouslySelectedStationId?: string;
    lockBodyScroll?: boolean;
}

const colors = ["Red", "Orange", "Blue", "Green", "Silver"];
const isColorLine = colors.includes.bind(colors);

const getIsHighlightedLine = (
    previouslySelectedStationId: string,
    line: string,
    stations: Station[]
) => {
    return (
        !isColorLine(line) && stations.some((station) => station.id === previouslySelectedStationId)
    );
};

const sortRegionalRailEntriesFirst = (previouslySelectedStationId: string) => (
    [lineA, stationsA]: [string, Station[]],
    [lineB, stationsB]: [string, Station[]]
) => {
    if (previouslySelectedStationId) {
        const valueA = +getIsHighlightedLine(previouslySelectedStationId, lineA, stationsA);
        const valueB = +getIsHighlightedLine(previouslySelectedStationId, lineB, stationsB);
        return valueB - valueA;
    }
    const valueA = +isColorLine(lineA);
    const valueB = +isColorLine(lineB);
    return valueA - valueB;
};

const sortStationsByName = (stationA: Station, stationB: Station) =>
    stationA.name > stationB.name ? 1 : -1;

const getStationsToColorMap = (stationsByLine: StationsByLine) => {
    const colorMap: { [id: string]: { id: string; name: string; colors: Set<string> } } = {};
    Object.entries(stationsByLine).forEach(([line, stations]) => {
        const color = isColorLine(line) ? line.toLowerCase() : "regional-rail";
        stations.forEach((station) => {
            if (!colorMap[station.id]) {
                colorMap[station.id] = { ...station, colors: new Set() };
            }
            colorMap[station.id].colors.add(color);
        });
    });
    return colorMap;
};

const fuzzyMatchStation = (searchTerm: string, station: Station) => {
    searchTerm = searchTerm.trim().toLowerCase();
    const lowercaseStation = station.name.toLowerCase();
    const matchesTerm =
        searchTerm.length > 1
            ? lowercaseStation.includes(searchTerm)
            : lowercaseStation.startsWith(searchTerm);
    return matchesTerm || station.id.toLowerCase() === searchTerm;
};

const StationPicker = (props: Props) => {
    const {
        children,
        stationsByLine,
        excludeColorLines,
        previouslySelectedStationId,
        onSelectStation,
        lockBodyScroll,
    } = props;
    const [searchTerm, setSearchTerm] = useState(null);
    const [disclosureBounds, setDisclosureBounds] = useState(null);
    const searchRef = useRef<HTMLInputElement>();
    const innerRef = useRef<HTMLDivElement>();
    const disclosure = useDisclosureState({ visible: false });
    const composite = useCompositeState({ currentId: null, loop: true });
    const searchResults = useCompositeState({ currentId: null, loop: true });
    const stationsToColor = useMemo(() => getStationsToColorMap(stationsByLine), [stationsByLine]);

    // Using data-station-id instead of generating a closure for each station's callback is a
    // performance enhancement recommended by Reakit when using a Composite with many items.
    const handleSelectStation = useCallback(
        (evt) => {
            const stationId = (evt.target as HTMLElement).getAttribute("data-station-id");
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

    const renderAllStationsListing = () => (
        <Composite {...composite} role="list" as="div" className={styles.stationList}>
            {Object.entries(stationsByLine)
                .sort(sortRegionalRailEntriesFirst(previouslySelectedStationId))
                .filter(([line]) => !excludeColorLines || !isColorLine(line))
                .map(([line, stations]) => {
                    const colorClass = isColorLine(line) ? line.toLowerCase() : "regional-rail";
                    const isHighlighted = getIsHighlightedLine(
                        previouslySelectedStationId,
                        line,
                        stations
                    );
                    return (
                        <ul
                            key={line}
                            className={classNames(
                                styles.stationGroup,
                                isHighlighted && "highlighted",
                                colorClass
                            )}
                        >
                            <CompositeItem
                                {...composite}
                                id={`${line}-line`}
                                as="li"
                                disabled={true}
                            >
                                {line} Line
                            </CompositeItem>
                            {stations.map((station) => (
                                <CompositeItem
                                    {...composite}
                                    id={`${line}-line-${station.id}`}
                                    key={station.id}
                                    disabled={station.id === previouslySelectedStationId}
                                    as="li"
                                    data-station-id={station.id}
                                    onClick={handleSelectStation}
                                >
                                    {station.name}
                                </CompositeItem>
                            ))}
                        </ul>
                    );
                })}
        </Composite>
    );

    const renderSearchResults = () => (
        <Composite
            {...searchResults}
            role="list"
            className={classNames(styles.stationList, "searching")}
        >
            <ul className={classNames(styles.stationGroup, "searching")}>
                {Object.values(stationsToColor)
                    .filter((station) => fuzzyMatchStation(searchTerm, station))
                    .sort(sortStationsByName)
                    .map((station) => (
                        <CompositeItem
                            {...searchResults}
                            id={`search-result-${station.id}`}
                            as="li"
                            key={station.id}
                            data-station-id={station.id}
                            onClick={handleSelectStation}
                        >
                            {station.name}
                            <div className={styles.lineBullets}>
                                {[...station.colors].map((color) => (
                                    <div key={color} className={color} />
                                ))}
                            </div>
                        </CompositeItem>
                    ))}
            </ul>
        </Composite>
    );

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
                <div className={styles.header}>
                    <div className={styles.controls}>
                        <input
                            type="text"
                            ref={searchRef}
                            value={searchTerm}
                            className={styles.search}
                            placeholder="Search for a station..."
                            onChange={(evt) => setSearchTerm(evt.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.stationListContainer}>
                    {!searchTerm && renderAllStationsListing()}
                    {searchTerm && renderSearchResults()}
                </div>
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
