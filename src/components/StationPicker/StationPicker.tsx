import React, { useRef, useEffect, useState, useMemo } from "react";
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
type StationsByLine = { [line: string]: Station[] };

interface Props {
    stationsByLine: StationsByLine;
    onSelectStation: (station: Station) => any;
}

const colors = ["Red", "Orange", "Blue", "Green", "Silver"];
const isColorLine = colors.includes.bind(colors);

const sortRegionalRailEntriesFirst = (entryA: [any, any], entryB: [any, any]) => {
    const valueA = +isColorLine(entryA[0]);
    const valueB = +isColorLine(entryB[0]);
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
    const lowercaseStation = station.name.toLowerCase();
    const matchesTerm =
        searchTerm.length > 1
            ? lowercaseStation.includes(searchTerm)
            : lowercaseStation.startsWith(searchTerm);
    return matchesTerm || station.id.toLowerCase() === searchTerm;
};

const StationPicker = (props: Props) => {
    const { stationsByLine } = props;
    const [searchTerm, setSearchTerm] = useState(null);
    const [disclosureBounds, setDisclosureBounds] = useState(null);
    const searchRef = useRef<HTMLInputElement>();
    const innerRef = useRef<HTMLDivElement>();
    const disclosure = useDisclosureState({ visible: false });
    const composite = useCompositeState({ currentId: null, loop: true });
    const searchResults = useCompositeState({ currentId: null, loop: true });
    const stationsToColor = useMemo(() => getStationsToColorMap(stationsByLine), [stationsByLine]);

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

    console.log(disclosureBounds);

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

    const renderAllStationsListing = () => (
        <Composite {...composite} role="list" as="div" className={styles.stationList}>
            {Object.entries(stationsByLine)
                .sort(sortRegionalRailEntriesFirst)
                .map(([line, stations]) => {
                    const colorClass = isColorLine(line) ? line.toLowerCase() : "regional-rail";
                    return (
                        <ul key={line} className={classNames(styles.stationGroup, colorClass)}>
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
                                    as="li"
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
                        >
                            {station.name}
                            <ul className={styles.lineBullets}>
                                {[...station.colors].map((color) => (
                                    <li key={color} className={color} />
                                ))}
                            </ul>
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
                    style={disclosureBounds && { marginLeft: disclosureBounds.width / 2 }}
                />
                <div className={styles.header}>
                    <div className={styles.controls}>
                        <input
                            type="text"
                            ref={searchRef}
                            value={searchTerm}
                            className={styles.search}
                            placeholder="Search for a station..."
                            onChange={(evt) => setSearchTerm(evt.target.value.trim().toLowerCase())}
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
                Choose a station...
            </Disclosure>
            <DisclosureContent {...disclosure}>{renderDisclosureContent()}</DisclosureContent>
        </div>
    );
};

export default StationPicker;
