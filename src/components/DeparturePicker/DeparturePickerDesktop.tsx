import React, { useState, useRef, useCallback } from "react";

import { NetworkTime, NetworkTimeRange } from "types";
import { stringifyTime } from "time";

import DeparturePickerChrome from "./DeparturePickerChrome";
import { DeparturePickerImplProps } from "./types";

import styles from "./DeparturePicker.module.scss";

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

const getIndicatorPositionFraction = (time: null | NetworkTime, timeRange: NetworkTimeRange) => {
    if (typeof time === "number") {
        const [start, end] = timeRange;
        return (time - start) / (end - start);
    }
    return null;
};

const DeparturePickerDesktop = (props: DeparturePickerImplProps) => {
    const { disabled = false, onSelectTime, time, timeRange, timeline } = props;
    const [cursorTime, setCursorTime] = useState<null | number>(null);
    const wrapper = useRef<null | HTMLDivElement>(null);

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
            onMouseMove={(evt) => handleMouseMove(evt.nativeEvent)}
            onClick={(evt) => handleClick(evt.nativeEvent)}
        >
            <DeparturePickerChrome
                disabled={disabled}
                indicatorPositionFraction={getIndicatorPositionFraction(time, timeRange)}
            >
                {timeline}
                {renderCursor()}
            </DeparturePickerChrome>
        </div>
    );
};

export default DeparturePickerDesktop;
