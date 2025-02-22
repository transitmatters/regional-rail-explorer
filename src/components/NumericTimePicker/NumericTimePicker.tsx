import React, { useCallback, useMemo, useState } from "react";
import classNames from "classnames";

import { HOUR, parseTime, stringifyTime } from "time";
import { NetworkTime, NetworkTimeRange } from "types";

import buttonStyles from "../Button/Button.module.scss";
import styles from "./NumericTimePicker.module.scss";

type Props = {
    time: NetworkTime;
    timeRange?: NetworkTimeRange;
    onSelectTime: (t: NetworkTime) => unknown;
    className?: string;
};

const defaultTimeRange = [0, 24 * HOUR - 1];

const NumericTimePicker: React.FunctionComponent<Props> = (props) => {
    const { time, onSelectTime, timeRange = defaultTimeRange, className } = props;
    const [capturingValue, setCapturingValue] = useState("");

    const [timeString, minTimeString, maxTimeString] = useMemo(
        () =>
            [time, ...timeRange].map((t) =>
                stringifyTime(t, {
                    use12Hour: false,
                    truncateLeadingZeros: false,
                })
            ),
        [time, timeRange]
    );

    const commitTime = useCallback((timeString: string) => {
        onSelectTime(parseTime(timeString));
        setCapturingValue("");
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setCapturingValue(e.target.value);
    }, []);

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            commitTime(e.target.value);
        },
        [capturingValue]
    );

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            commitTime((e.target as HTMLInputElement).value);
        }
    }, []);

    return (
        <input
            type="time"
            aria-label="Departure or arrival time"
            className={classNames(buttonStyles.button, styles.numericTimePicker, className)}
            value={capturingValue || timeString}
            min={minTimeString}
            max={maxTimeString}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
        />
    );
};

export default NumericTimePicker;
