import React, { useState, useMemo, useCallback } from "react";
import { Composite, CompositeItem, useCompositeState } from "reakit";
import classNames from "classnames";

import StationSearchBar from "./StationSearchBar";

import styles from "./StationListing.module.scss";
import { getLinkToStation } from "stations";

type Station = { id: string; name: string };
export type StationsByLine = { [line: string]: Station[] };

type Props = {
    excludeColorLines?: boolean;
    onSelectStation?: (stationId: string) => any;
    previouslySelectedStationId?: string;
    stationsByLine: StationsByLine;
    searchRef?: React.MutableRefObject<null | HTMLInputElement>;
    showSearch?: boolean;
    searchTerm?: string;
    linkToStations?: boolean;
};

const colors = ["Red", "Orange", "Blue", "Green", "Silver"];
const isColorLine = colors.includes.bind(colors);
const noop = () => {};
const focusSearch = (el) => el?.focus();

const getIsHighlightedLine = (
    previouslySelectedStationId: undefined | string,
    line: string,
    stations: Station[]
) => {
    return (
        !isColorLine(line) && stations.some((station) => station.id === previouslySelectedStationId)
    );
};

const sortRegionalRailEntriesFirst = (previouslySelectedStationId?: string) => (
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

const StationListing = React.forwardRef((props: Props, ref: any) => {
    const {
        stationsByLine,
        excludeColorLines,
        previouslySelectedStationId,
        onSelectStation = noop,
        searchRef = focusSearch,
        showSearch = true,
        linkToStations = false,
        searchTerm: providedSearchTerm = null,
    } = props;
    const [ownSearchTerm, setOwnSearchTerm] = useState("");
    const composite = useCompositeState({ currentId: null, loop: true });
    const searchResults = useCompositeState({ currentId: null, loop: true });
    const stationsToColor = useMemo(() => getStationsToColorMap(stationsByLine), [stationsByLine]);
    const searchTerm = providedSearchTerm || ownSearchTerm;

    // Using data-station-id instead of generating a closure for each station's callback is a
    // performance enhancement recommended by Reakit when using a Composite with many items.
    const handleSelectStation = useCallback(
        (evt) => {
            const stationId = (evt.target as HTMLElement).getAttribute("data-station-id")!;
            onSelectStation(stationId);
        },
        [onSelectStation]
    );

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
                                    {linkToStations ? (
                                        <a href={getLinkToStation(station)}>{station.name}</a>
                                    ) : (
                                        station.name
                                    )}
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
                    .filter((station) =>
                        fuzzyMatchStation(providedSearchTerm || searchTerm, station)
                    )
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

    return (
        <div className={styles.stationListing} ref={ref}>
            {showSearch && (
                <div className={styles.header}>
                    <div className={styles.controls}>
                        <StationSearchBar
                            value={searchTerm}
                            onChange={setOwnSearchTerm}
                            ref={searchRef}
                        />
                    </div>
                </div>
            )}
            <div className={styles.stationListContainer}>
                {!searchTerm && renderAllStationsListing()}
                {searchTerm && renderSearchResults()}
            </div>
        </div>
    );
});

export default StationListing;