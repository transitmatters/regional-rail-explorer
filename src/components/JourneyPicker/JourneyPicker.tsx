import React, { useCallback, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { GrDown, GrUp } from "react-icons/gr";
import { MdSwapCalls } from "react-icons/md";

import { HOUR } from "time";
import { Button, NumericTimePicker, Select } from "components";
import { JourneyParams, NetworkDayKind, NetworkTime, NetworkTimeRange, TimeOfDay } from "types";
import { StationPicker, StationsByLine } from "components";
import { useAppContext } from "hooks";

import styles from "./JourneyPicker.module.scss";

type NavigationKind = "depart-at" | "arrive-by";

type Station = {
    id: string;
    name: string;
};
type Props = {
    day: NetworkDayKind;
    fromStationId: null | string;
    toStationId: null | string;
    onSelectDay: (day: NetworkDayKind) => unknown;
    onSelectJourney: (params: Partial<JourneyParams>) => any;
    onSelectTimeOfDay: (time: TimeOfDay) => unknown;
    stationsById: Record<string, Station>;
    stationsByLine: StationsByLine;
    time: null | NetworkTime;
    timeRange: NetworkTimeRange;
    disabled?: boolean;
    reverse: boolean;
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
];

const getTimeOfDayOptionForTime = (time: NetworkTime) => {
    const index = time > 17 * HOUR ? 2 : time > 11 * HOUR ? 1 : 0;
    return timeOfDayPickerOptions[index];
};

// eslint-disable-next-line react/prop-types
const StationPickerWithDisclosure = ({ label, disabled, ...restProps }) => {
    const { stationPickerDiscloseBelowElement } = useAppContext();
    return (
        <StationPicker
            discloseBelowElement={stationPickerDiscloseBelowElement}
            {...(restProps as any)}
        >
            {(disclosureProps) => {
                const { "aria-expanded": open } = disclosureProps;
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
        </StationPicker>
    );
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
        onSelectJourney,
        onSelectTimeOfDay,
        stationsById,
        stationsByLine,
        time,
        timeRange,
        toStationId,
        disabled,
        reverse,
    } = props;

    const [timeOfDay, setTimeOfDay] = useState(() =>
        typeof time === "number" ? getTimeOfDayOptionForTime(time) : timeOfDayPickerOptions[0]
    );

    const fromStation = fromStationId ? stationsById[fromStationId] : null;
    const toStation = toStationId ? stationsById[toStationId] : null;

    const navigationKind = useMemo(
        () =>
            navigationKindOptions.find(
                (option) => option.id === (reverse ? "arrive-by" : "depart-at")
            )!,
        [reverse]
    );

    const swapStations = useCallback(() => {
        if (fromStationId && toStationId) {
            onSelectJourney({ fromStationId: toStationId, toStationId: fromStationId });
        }
    }, [onSelectJourney, fromStationId, toStationId]);

    useEffect(() => {
        if (typeof time === "number") {
            setTimeOfDay(getTimeOfDayOptionForTime(time));
        }
    }, [time]);

    return (
        <div className={styles.journeyPicker}>
            <div className="group from-to-stations">
                <LabeledControl label="From" className="from-station">
                    <StationPickerWithDisclosure
                        lockBodyScroll
                        disabled={disabled}
                        label={fromStation?.name ?? "Choose a station"}
                        onSelectStation={(stationId) =>
                            onSelectJourney({ fromStationId: stationId })
                        }
                        stationsByLine={stationsByLine}
                    />
                </LabeledControl>
                <LabeledControl label="to" className="to-station">
                    <StationPickerWithDisclosure
                        lockBodyScroll
                        disabled={disabled}
                        label={toStation?.name ?? "Choose a station"}
                        onSelectStation={(stationId) => onSelectJourney({ toStationId: stationId })}
                        stationsByLine={stationsByLine}
                        previouslySelectedStationId={fromStation && fromStation.id}
                    />
                </LabeledControl>
                <Button large outline className="swap-stations-button" onClick={swapStations}>
                    <MdSwapCalls size="1.3em" />
                </Button>
            </div>
            <div className="group time-details">
                <div className={classNames(styles.label, styles.labelHiddenOnMobile)}>
                    Leave on a
                </div>
                <Select
                    disclosureProps={{ large: true, disabled }}
                    aria-label="Choose a day of the week"
                    items={dayKindOptions}
                    selectedItem={dayKindOptions.find((item) => item.id === day)!}
                    onSelect={(item) => onSelectDay(item.id)}
                />
                <div className={styles.spacer} />
                <Select
                    className={styles.dropdown}
                    disclosureProps={{ large: true, disabled: disabled }}
                    aria-label="Choose a departure time"
                    items={timeOfDayPickerOptions}
                    selectedItem={timeOfDay}
                    onSelect={(item) => {
                        setTimeOfDay(item);
                        onSelectTimeOfDay(item.id);
                    }}
                />
                <div className={classNames(styles.label, styles.labelHiddenOnMobile)}>and</div>
                <div className={styles.mobileSpacer} />
                <Select
                    className={styles.dropdown}
                    disclosureProps={{ large: true, disabled: disabled }}
                    aria-label="Choose when you want to depart or arrive"
                    items={navigationKindOptions}
                    selectedItem={navigationKind}
                    onSelect={(kind) => onSelectJourney({ reverse: kind.id === "arrive-by" })}
                />
                <div className={styles.spacer} />
                <NumericTimePicker
                    className={styles.numericTime}
                    time={time || 9 * HOUR}
                    timeRange={timeRange}
                    onSelectTime={(time) => onSelectJourney({ time })}
                />
            </div>
        </div>
    );
};

export default JourneyPicker;
