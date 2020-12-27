import React, { useEffect, useState } from "react";
import { GrDown, GrUp } from "react-icons/gr";

import { Button, Select } from "components";
import StationPicker, { StationsByLine } from "components/StationPicker/StationPicker";
import { JourneyParams, NetworkDayKind, NetworkTime, TimeOfDay } from "types";

import styles from "./JourneyPicker.module.scss";
import { HOUR } from "time";
interface Station {
    id: string;
    name: string;
}
interface Props {
    day: NetworkDayKind;
    fromStationId: string;
    onSelectDay: (day: NetworkDayKind) => unknown;
    onSelectJourney: (params: Partial<JourneyParams>) => any;
    onSelectTimeOfDay: (time: TimeOfDay) => unknown;
    stationsById: Record<string, Station>;
    stationsByLine: StationsByLine;
    time: NetworkTime;
    toStationId: string;
    disabled?: boolean;
}

const timeOfDayPickerOptions = [
    { id: "morning" as TimeOfDay, label: "Morning" },
    { id: "midday" as TimeOfDay, label: "Midday" },
    { id: "evening" as TimeOfDay, label: "Evening" },
];

const dayKindOptions = [
    { id: "weekday" as NetworkDayKind, label: "Weekday" },
    { id: "saturday" as NetworkDayKind, label: "Saturday" },
    { id: "sunday" as NetworkDayKind, label: "Sunday" },
];

// eslint-disable-next-line react/prop-types
const StationPickerWithDisclosure = ({ label, disabled, ...restProps }) => {
    return (
        <StationPicker {...(restProps as any)}>
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
    } = props;

    const [timeOfDay, setTimeOfDay] = useState(timeOfDayPickerOptions[0]);

    const fromStation = stationsById[fromStationId];
    const toStation = stationsById[toStationId];

    useEffect(() => {
        const index = time > 17 * HOUR ? 2 : time > 11 * HOUR ? 1 : 0;
        setTimeOfDay(timeOfDayPickerOptions[index]);
    }, [time]);

    return (
        <div className={styles.journeyPicker}>
            <div className="group">
                <div className="label">From</div>
                <StationPickerWithDisclosure
                    lockBodyScroll
                    disabled={disabled}
                    label={fromStation?.name ?? "Choose a station"}
                    onSelectStation={(stationId) => onSelectJourney({ fromStationId: stationId })}
                    stationsByLine={stationsByLine}
                />
                <div className="label">to</div>
                <StationPickerWithDisclosure
                    lockBodyScroll
                    disabled={disabled}
                    label={toStation?.name ?? "Choose a station"}
                    onSelectStation={(stationId) => onSelectJourney({ toStationId: stationId })}
                    stationsByLine={stationsByLine}
                    previouslySelectedStationId={fromStation && fromStation.id}
                />
            </div>
            <div className="group">
                <div className="label">Leave during</div>
                <Select
                    disclosureProps={{ large: true, disabled: disabled }}
                    aria-label="Choose a departure time"
                    items={timeOfDayPickerOptions}
                    selectedItem={timeOfDay}
                    onSelect={(item) => {
                        setTimeOfDay(item);
                        onSelectTimeOfDay(item.id);
                    }}
                />
                <div className="label">on a</div>
                <Select
                    disclosureProps={{ large: true, disabled }}
                    aria-label="Choose a day of the week"
                    items={dayKindOptions}
                    selectedItem={dayKindOptions.find((item) => item.id === day)}
                    onSelect={(item) => onSelectDay(item.id)}
                />
            </div>
        </div>
    );
};

export default JourneyPicker;
