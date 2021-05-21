import React, { useState, useRef, useCallback } from "react";
import classNames from "classnames";

import { NetworkTime, NetworkTimeRange } from "types";
import { DAY, HOUR, stringifyTime } from "time";
import FrequencyTimeline from "components/FrequencyTimeline/FrequencyTimeline";

import styles from "./DeparturePicker.module.scss";

interface Props {
    onSelectTime: (time: NetworkTime) => any;
    enhancedArrivals: NetworkTime[];
    baselineArrivals: NetworkTime[];
    spanFullDay?: boolean;
    timePadding?: number;
    time: null | number;
    disabled?: boolean;
}

const roundToNearestHour = (time: NetworkTime): NetworkTime => {
    const hoursPart = Math.floor(time / HOUR);
    const minutesPart = time % HOUR;
    if (minutesPart >= HOUR / 2) {
        return HOUR * (hoursPart + 1);
    }
    return HOUR * hoursPart;
};

const getTimeRange = (
    allArrivals: NetworkTime[],
    spanFullDay: boolean,
    padding: number
): NetworkTimeRange => {
    if (spanFullDay) {
        return [0 - padding, DAY + padding];
    }
    let min = Infinity;
    let max = -Infinity;
    allArrivals.forEach((time) => {
        min = Math.min(time, min);
        max = Math.max(time, max);
    });
    return [roundToNearestHour(min) - padding, roundToNearestHour(max) + padding];
};

const getTimeFromCursorPosition = (
    cursorClientX: number,
    timeRange: NetworkTimeRange,
    wrapperElement: HTMLElement
) => {
    const [start, end] = timeRange;
    const { width, left } = wrapperElement.getBoundingClientRect();
    const progress = (cursorClientX - left) / width;
    return Math.floor(start + (end - start) * progress);
};

const getCursorTransformForTime = (
    time: NetworkTime,
    timeRange: NetworkTimeRange,
    wrapperElement: HTMLElement
) => {
    const { width } = wrapperElement.getBoundingClientRect();
    const [start, end] = timeRange;
    const progress = (time - start) / (end - start);
    const left = progress * width;
    const buffer = 5;
    const offset = Math.max(buffer, Math.min(width - buffer, left));
    return `translateX(${offset}px)`;
};

const DeparturePicker = (props: Props) => {
    const {
        spanFullDay = false,
        disabled = false,
        baselineArrivals,
        enhancedArrivals,
        onSelectTime,
        time,
        timePadding = 0,
    } = props;
    const [cursorTime, setCursorTime] = useState<null | number>(null);
    const hasSelected = typeof time === "number";
    const wrapper = useRef<null | HTMLDivElement>(null);
    const timeRange = getTimeRange(
        [...baselineArrivals, ...enhancedArrivals],
        spanFullDay,
        timePadding
    );

    const handleClick = useCallback(
        (evt: MouseEvent) =>
            onSelectTime(getTimeFromCursorPosition(evt.clientX, timeRange, wrapper.current!)),
        [timeRange]
    );

    const handleMouseMove = useCallback(
        (evt: MouseEvent) =>
            setCursorTime(getTimeFromCursorPosition(evt.clientX, timeRange, wrapper.current!)),
        [timeRange]
    );

    const renderIndicator = () => {
        if (wrapper.current && time) {
            return (
                <div
                    className={classNames(styles.indicator, !hasSelected && styles.invisible)}
                    style={{
                        transform: getCursorTransformForTime(time, timeRange, wrapper.current),
                    }}
                >
                    <div className={styles.indicatorInner}>
                        <div className={styles.topTriangle} />
                        <div className={styles.needle} />
                        <div className={styles.bottomTriangle} />
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderCursor = () => {
        if (wrapper.current && cursorTime) {
            return (
                <div
                    className={styles.cursor}
                    style={{
                        transform: getCursorTransformForTime(
                            cursorTime,
                            timeRange,
                            wrapper.current
                        ),
                    }}
                >
                    <div className={styles.cursorNeedle} />
                    <span className={styles.cursorTime}>
                        {stringifyTime(cursorTime, { use12Hour: true })}
                    </span>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            ref={wrapper}
            className={classNames(styles.departurePicker, disabled && styles.disabled)}
            onMouseMove={(evt) => handleMouseMove(evt.nativeEvent)}
            onClick={(evt) => handleClick(evt.nativeEvent)}
        >
            <div className={styles.top} />
            <div className={styles.container}>
                <FrequencyTimeline
                    baselineArrivals={baselineArrivals}
                    enhancedArrivals={enhancedArrivals}
                    timeRange={timeRange}
                />
                {renderCursor()}
                {renderIndicator()}
            </div>
            <div className={styles.bottom} />
        </div>
    );
};

export default DeparturePicker;
