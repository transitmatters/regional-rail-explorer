import React, { useCallback, useEffect, useState, useMemo } from "react";
import classNames from "classnames";
import { MdSwapCalls } from "react-icons/md";

import { HOUR } from "time";
import { Button, NumericTimePicker, Select } from "components";
import {
    JourneyParams,
    NetworkDayKind,
    NetworkTime,
    NetworkTimeRange,
    TimeOfDay,
    NavigationKind,
} from "types";
import { StationPickerWithDisclosure, StationsByLine } from "components";
import AddressAutocomplete, { AddressSelection } from "../AddressAutocomplete/AddressAutocomplete";
import { useDisclosureStore } from "@ariakit/react";

import styles from "./JourneyPicker.module.scss";

type Station = {
    id: string;
    name: string;
};
type Props = {
    day: NetworkDayKind;
    fromStationId: null | string;
    toStationId: null | string;
    onSelectDay: (day: NetworkDayKind) => unknown;
    updateJourneyParams: (params: Partial<JourneyParams>) => any;
    onSelectTimeOfDay: (time: TimeOfDay) => unknown;
    stationsById: Record<string, Station>;
    stationsByLine: StationsByLine;
    time: null | NetworkTime;
    timeRange: NetworkTimeRange;
    disabled?: boolean;
    navigationKind: string;
    fromAddress?: string;
    toAddress?: string;
    onChangeFromAddress?: (value: string) => void;
    onChangeToAddress?: (value: string) => void;
    onSelectFromAddress?: (selection: AddressSelection) => void;
    onSelectToAddress?: (selection: AddressSelection) => void;
    onSelectFromStation?: (stationId: string) => void;
    onSelectToStation?: (stationId: string) => void;
};

const timeOfDayPickerOptions = [
    { id: "morning" as TimeOfDay, label: "morning" },
    { id: "midday" as TimeOfDay, label: "midday" },
    { id: "evening" as TimeOfDay, label: "evening" },
];

const dayKindOptions = [
    { id: "weekday" as NetworkDayKind, label: "weekday" },
    { id: "saturday" as NetworkDayKind, label: "Saturday" },
    { id: "sunday" as NetworkDayKind, label: "Sunday" },
];

const navigationKindOptions = [
    { id: "depart-at" as NavigationKind, label: "depart at" },
    { id: "arrive-by" as NavigationKind, label: "arrive by" },
    { id: "depart-after" as NavigationKind, label: "depart after" },
];

const getTimeOfDayOptionForTime = (time: NetworkTime) => {
    const index = time > 17 * HOUR ? 2 : time > 11 * HOUR ? 1 : 0;
    return timeOfDayPickerOptions[index];
};

// eslint-disable-next-line react/prop-types
const LabeledControl = ({ label, children, className = "" }) => {
    return (
        <div className={classNames(styles.labeledControl, className)}>
            <div className={styles.label}>{label}</div>
            {children}
        </div>
    );
};

const JourneyPicker: React.FunctionComponent<Props> = (props) => {
    const {
        day,
        fromStationId,
        onSelectDay,
        updateJourneyParams,
        onSelectTimeOfDay,
        stationsById,
        stationsByLine,
        time,
        timeRange,
        toStationId,
        disabled,
        navigationKind,
        fromAddress = "",
        toAddress = "",
        onChangeFromAddress,
        onChangeToAddress,
        onSelectFromAddress,
        onSelectToAddress,
        onSelectFromStation,
        onSelectToStation,
    } = props;

    const [timeOfDay, setTimeOfDay] = useState(() =>
        typeof time === "number" ? getTimeOfDayOptionForTime(time) : timeOfDayPickerOptions[0]
    );
    const [fromInputMode, setFromInputMode] = useState<"station" | "address">(
        fromAddress ? "address" : "station"
    );
    const [toInputMode, setToInputMode] = useState<"station" | "address">(
        toAddress ? "address" : "station"
    );
    const fromDisclosure = useDisclosureStore({ defaultOpen: false });
    const toDisclosure = useDisclosureStore({ defaultOpen: false });

    const selectedNavigationKind = useMemo(() => {
        return (
            navigationKindOptions.find((o) => o.id === navigationKind) || navigationKindOptions[0]
        );
    }, [navigationKind]);

    const fromStation = fromStationId ? stationsById[fromStationId] : null;
    const toStation = toStationId ? stationsById[toStationId] : null;

    const swapStations = useCallback(() => {
        if (fromStationId && toStationId) {
            updateJourneyParams({ fromStationId: toStationId, toStationId: fromStationId });
        }
    }, [updateJourneyParams, fromStationId, toStationId]);

    useEffect(() => {
        if (typeof time === "number") {
            setTimeOfDay(getTimeOfDayOptionForTime(time));
        }
    }, [time]);

    const handleSelectDepartureOption = useCallback(
        (kind: (typeof navigationKindOptions)[number]) => {
            updateJourneyParams({
                navigationKind: kind.id,
            });
        },
        [updateJourneyParams]
    );

    const handleSelectFromStation = useCallback(
        (stationId: string) => {
            updateJourneyParams({ fromStationId: stationId });
            onSelectFromStation?.(stationId);
            setFromInputMode("station");
        },
        [updateJourneyParams, onSelectFromStation]
    );

    const handleSelectToStation = useCallback(
        (stationId: string) => {
            updateJourneyParams({ toStationId: stationId });
            onSelectToStation?.(stationId);
            setToInputMode("station");
        },
        [updateJourneyParams, onSelectToStation]
    );

    const closeStationPickers = () => {
        fromDisclosure.setOpen(false);
        toDisclosure.setOpen(false);
    };

    const renderModeToggle = (
        mode: "station" | "address",
        setMode: (value: "station" | "address") => void
    ) => {
        return (
            <div className={styles.modeToggle}>
                <button
                    type="button"
                    className={classNames(styles.modeButton, mode === "station" && styles.active)}
                    onClick={() => {
                        setMode("station");
                    }}
                >
                    Station
                </button>
                <button
                    type="button"
                    className={classNames(styles.modeButton, mode === "address" && styles.active)}
                    onClick={() => {
                        setMode("address");
                        closeStationPickers();
                    }}
                >
                    Address
                </button>
            </div>
        );
    };

    return (
        <div className={styles.journeyPicker}>
            <div className="group from-to-stations">
                <LabeledControl label="From" className="from-station">
                    <div className={styles.inputStack}>
                        {renderModeToggle(fromInputMode, setFromInputMode)}
                        {fromInputMode === "station" ? (
                            <StationPickerWithDisclosure
                                lockBodyScroll
                                disabled={disabled}
                                label={fromStation?.name ?? "Choose a station"}
                                onSelectStation={handleSelectFromStation}
                                stationsByLine={stationsByLine}
                                disclosure={fromDisclosure}
                                onOpen={() => toDisclosure.setOpen(false)}
                            />
                        ) : (
                            <AddressAutocomplete
                                value={fromAddress}
                                disabled={disabled}
                                placeholder="Start address"
                                onChange={(value) => onChangeFromAddress?.(value)}
                                onSelect={(selection) => onSelectFromAddress?.(selection)}
                                onFocus={closeStationPickers}
                            />
                        )}
                    </div>
                </LabeledControl>
                <LabeledControl label="to" className="to-station">
                    <div className={styles.inputStack}>
                        {renderModeToggle(toInputMode, setToInputMode)}
                        {toInputMode === "station" ? (
                            <StationPickerWithDisclosure
                                lockBodyScroll
                                disabled={disabled}
                                label={toStation?.name ?? "Choose a station"}
                                onSelectStation={handleSelectToStation}
                                stationsByLine={stationsByLine}
                                previouslySelectedStationId={fromStation && fromStation.id}
                                disclosure={toDisclosure}
                                onOpen={() => fromDisclosure.setOpen(false)}
                            />
                        ) : (
                            <AddressAutocomplete
                                value={toAddress}
                                disabled={disabled}
                                placeholder="End address"
                                onChange={(value) => onChangeToAddress?.(value)}
                                onSelect={(selection) => onSelectToAddress?.(selection)}
                                onFocus={closeStationPickers}
                            />
                        )}
                    </div>
                </LabeledControl>
                <Button large outline className="swap-stations-button" onClick={swapStations}>
                    <MdSwapCalls size="1.3em" />
                </Button>
            </div>
            <div className="group time-details">
                <div className={classNames(styles.label, styles.hiddenOnMobile)}>Leave on a</div>
                <Select
                    disclosureProps={{ large: true, disabled }}
                    aria-label="Choose a day of the week"
                    items={dayKindOptions}
                    selectedItem={dayKindOptions.find((item) => item.id === day)!}
                    onSelect={(item) => onSelectDay(item.id)}
                />
                <div className={styles.spacer} />
                <Select
                    disclosureProps={{
                        large: true,
                        disabled: disabled,
                        className: styles.hiddenOnMobile,
                    }}
                    aria-label="Choose a departure time"
                    items={timeOfDayPickerOptions}
                    selectedItem={timeOfDay}
                    onSelect={(item) => {
                        setTimeOfDay(item);
                        onSelectTimeOfDay(item.id);
                    }}
                />
                <div className={classNames(styles.label, styles.hiddenOnMobile)}>and</div>
                <Select
                    disclosureProps={{ large: true, disabled: disabled }}
                    aria-label="Choose when you want to depart or arrive"
                    items={navigationKindOptions}
                    selectedItem={selectedNavigationKind}
                    onSelect={handleSelectDepartureOption}
                />
                <div className={styles.spacer} />
                <NumericTimePicker
                    className={styles.numericTime}
                    time={time || 9 * HOUR}
                    timeRange={timeRange}
                    onSelectTime={(time) => updateJourneyParams({ time })}
                />
            </div>
        </div>
    );
};

export default JourneyPicker;
