import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GrDown, GrUp } from "react-icons/gr";
import classNames from "classnames";

import { Button, Select } from "components";
import StationPicker, { StationsByLine } from "components/StationPicker/StationPicker";
import { JourneyParams, NetworkDayKind, NetworkTime, TimeOfDay } from "types";

import styles from "./JourneyPicker.module.scss";
import { HOUR } from "time";
import { MdSwapCalls } from "react-icons/md";
import { AppFrameContext } from "components/AppFrame";

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
    { id: "depart-at" as NavigationKind, label: "depart at..." },
    { id: "arrive-by" as NavigationKind, label: "arrive by..." },
];

// eslint-disable-next-line react/prop-types
const StationPickerWithDisclosure = ({ label, disabled, ...restProps }) => {
    const { controlsContainer } = useContext(AppFrameContext);
    return (
        <StationPicker discloseBelowElement={controlsContainer} {...(restProps as any)}>
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
        toStationId,
        disabled,
        reverse,
    } = props;

    const [timeOfDay, setTimeOfDay] = useState(timeOfDayPickerOptions[0]);

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
            const index = time > 17 * HOUR ? 2 : time > 11 * HOUR ? 1 : 0;
            setTimeOfDay(timeOfDayPickerOptions[index]);
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
                <div className={styles.label}>Leave on a</div>
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
                <div className={styles.label}>and</div>
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
            </div>
        </div>
    );
};

export default JourneyPicker;
