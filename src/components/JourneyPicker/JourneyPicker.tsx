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

const JourneyPicker = (props: Props) => {
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
    } = props;

    const [timeOfDay, setTimeOfDay] = useState(() =>
        typeof time === "number" ? getTimeOfDayOptionForTime(time) : timeOfDayPickerOptions[0]
    );

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
        },
        [updateJourneyParams]
    );

    const handleSelectToStation = useCallback(
        (stationId: string) => {
            updateJourneyParams({ toStationId: stationId });
        },
        [updateJourneyParams]
    );

    return (
        <div className={styles.journeyPicker}>
            <div className="group from-to-stations">
                <LabeledControl label="From" className="from-station">
                    <StationPickerWithDisclosure
                        lockBodyScroll
                        disabled={disabled}
                        label={fromStation?.name ?? "Choose a station"}
                        onSelectStation={handleSelectFromStation}
                        stationsByLine={stationsByLine}
                    />
                </LabeledControl>
                <LabeledControl label="to" className="to-station">
                    <StationPickerWithDisclosure
                        lockBodyScroll
                        disabled={disabled}
                        label={toStation?.name ?? "Choose a station"}
                        onSelectStation={handleSelectToStation}
                        stationsByLine={stationsByLine}
                        previouslySelectedStationId={fromStation && fromStation.id}
                    />
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
