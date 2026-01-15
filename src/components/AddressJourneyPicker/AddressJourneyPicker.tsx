import React, { useCallback, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { MdSwapCalls } from "react-icons/md";

import { HOUR } from "time";
import { Button, NumericTimePicker, Select } from "components";
import {
    NetworkDayKind,
    NetworkTime,
    NetworkTimeRange,
    TimeOfDay,
    NavigationKind,
} from "types";

import AddressAutocomplete, { AddressSelection } from "../AddressAutocomplete/AddressAutocomplete";

import styles from "./AddressJourneyPicker.module.scss";

type Props = {
    day: NetworkDayKind;
    time: null | NetworkTime;
    timeRange: NetworkTimeRange;
    disabled?: boolean;
    navigationKind: NavigationKind;
    fromAddress: string;
    toAddress: string;
    onSelectDay: (day: NetworkDayKind) => unknown;
    onSelectTimeOfDay: (time: TimeOfDay) => unknown;
    onSelectNavigationKind: (kind: NavigationKind) => unknown;
    onSelectTime: (time: NetworkTime) => unknown;
    onSwap: () => unknown;
    onChangeFromAddress: (value: string) => unknown;
    onChangeToAddress: (value: string) => unknown;
    onSelectFromAddress: (selection: AddressSelection) => unknown;
    onSelectToAddress: (selection: AddressSelection) => unknown;
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

const AddressJourneyPicker: React.FunctionComponent<Props> = ({
    day,
    time,
    timeRange,
    disabled,
    navigationKind,
    fromAddress,
    toAddress,
    onSelectDay,
    onSelectTimeOfDay,
    onSelectNavigationKind,
    onSelectTime,
    onSwap,
    onChangeFromAddress,
    onChangeToAddress,
    onSelectFromAddress,
    onSelectToAddress,
}) => {
    const [timeOfDay, setTimeOfDay] = useState(() =>
        typeof time === "number" ? getTimeOfDayOptionForTime(time) : timeOfDayPickerOptions[0]
    );

    const selectedNavigationKind = useMemo(
        () => navigationKindOptions.find((o) => o.id === navigationKind) || navigationKindOptions[0],
        [navigationKind]
    );

    useEffect(() => {
        if (typeof time === "number") {
            setTimeOfDay(getTimeOfDayOptionForTime(time));
        }
    }, [time]);

    const handleSelectDepartureOption = useCallback(
        (kind: (typeof navigationKindOptions)[number]) => {
            onSelectNavigationKind(kind.id);
        },
        [onSelectNavigationKind]
    );

    return (
        <div className={styles.journeyPicker}>
            <div className="group from-to-stations">
                <LabeledControl label="From" className="from-station">
                    <AddressAutocomplete
                        value={fromAddress}
                        placeholder="Start address"
                        disabled={disabled}
                        onChange={onChangeFromAddress}
                        onSelect={onSelectFromAddress}
                    />
                </LabeledControl>
                <LabeledControl label="to" className="to-station">
                    <AddressAutocomplete
                        value={toAddress}
                        placeholder="Destination address"
                        disabled={disabled}
                        onChange={onChangeToAddress}
                        onSelect={onSelectToAddress}
                    />
                </LabeledControl>
                <Button large outline className="swap-stations-button" onClick={onSwap}>
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
                    onSelectTime={onSelectTime}
                />
            </div>
        </div>
    );
};

export default AddressJourneyPicker;
