import React, { useCallback, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { MdSwapCalls } from "react-icons/md";

import { HOUR } from "time";
import { Button, NumericTimePicker, Select } from "components";
import { NetworkDayKind, NetworkTime, NetworkTimeRange, TimeOfDay, NavigationKind } from "types";
import AddressAutocomplete, { AddressSelection } from "../AddressAutocomplete/AddressAutocomplete";

import styles from "./AddressJourneyPicker.module.scss";

type Props = {
    day: NetworkDayKind;
    fromAddress: string;
    toAddress: string;
    onSelectDay: (day: NetworkDayKind) => unknown;
    onSelectTimeOfDay: (time: TimeOfDay) => unknown;
    onSelectNavigationKind: (kind: NavigationKind) => unknown;
    onSelectTime: (time: NetworkTime) => unknown;
    onSwap: () => void;
    onChangeFromAddress: (value: string) => void;
    onChangeToAddress: (value: string) => void;
    onSelectFromAddress: (selection: AddressSelection) => void;
    onSelectToAddress: (selection: AddressSelection) => void;
    time: null | NetworkTime;
    timeRange: NetworkTimeRange;
    disabled?: boolean;
    navigationKind: NavigationKind;
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

const LabeledControl = ({ label, children, className = "" }) => {
    return (
        <div className={classNames(styles.labeledControl, className)}>
            <div className={styles.label}>{label}</div>
            {children}
        </div>
    );
};

const AddressJourneyPicker: React.FunctionComponent<Props> = (props) => {
    const {
        day,
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
        time,
        timeRange,
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

    useEffect(() => {
        if (typeof time === "number") {
            setTimeOfDay(getTimeOfDayOptionForTime(time));
        }
    }, [time]);

    const handleSelectNavigationKind = useCallback(
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
                        disabled={disabled}
                        placeholder="Start address"
                        onChange={onChangeFromAddress}
                        onSelect={onSelectFromAddress}
                    />
                </LabeledControl>
                <LabeledControl label="to" className="to-station">
                    <AddressAutocomplete
                        value={toAddress}
                        disabled={disabled}
                        placeholder="End address"
                        onChange={onChangeToAddress}
                        onSelect={onSelectToAddress}
                    />
                </LabeledControl>
                <Button
                    large
                    outline
                    className="swap-stations-button"
                    onClick={onSwap}
                    disabled={disabled}
                >
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
                    onSelect={handleSelectNavigationKind}
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
