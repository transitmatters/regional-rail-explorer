import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames";

import { NetworkTime, NetworkTimeRange } from "types";
import { DAY, HOUR } from "time";
import FrequencyTimeline from "components/FrequencyTimeline/FrequencyTimeline";

import styles from "./DeparturePicker.module.scss";

interface Props {
    onSelectTime: (time: NetworkTime) => any;
    onUpdateTime: (time: NetworkTime) => any;
    enhancedArrivals: NetworkTime[];
    baselineArrivals: NetworkTime[];
    spanFullDay?: boolean;
    timePadding?: number;
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

const DeparturePicker = (props: Props) => {
    const {
        spanFullDay = false,
        baselineArrivals,
        enhancedArrivals,
        onUpdateTime,
        onSelectTime,
        timePadding = 0,
    } = props;
    const [isCapturing, setIsCapturing] = useState(false);
    const [offset, setOffset] = useState<NetworkTime>(0);
    const [hasSelected, setHasSelected] = useState(false);
    const wrapper = useRef<HTMLDivElement>(null);
    const timeRange = getTimeRange(
        [...baselineArrivals, ...enhancedArrivals],
        spanFullDay,
        timePadding
    );

    useEffect(() => {
        if (isCapturing) {
            const handleMouseUp = () => setIsCapturing(false);
            window.addEventListener("mousemove", handleMouseEvent);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseEvent);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isCapturing]);

    const handleMouseEvent = (evt: MouseEvent) => {
        if (isCapturing || evt.type === "click") {
            const { clientX } = evt;
            const [start, end] = timeRange;
            const { width, left } = wrapper.current.getBoundingClientRect();
            const buffer = 5;
            const progress = (clientX - left) / width;
            const nextTime = start + (end - start) * progress;
            const nextOffset = Math.max(buffer, Math.min(width - buffer, clientX - left));
            setHasSelected(true);
            setOffset(nextOffset);
            onUpdateTime(nextTime);
        }
    };

    return (
        <div
            ref={wrapper}
            className={styles.departurePicker}
            onMouseDown={() => setIsCapturing(true)}
            onClick={(evt) => handleMouseEvent(evt.nativeEvent)}
        >
            <div className={styles.top} />
            <div className={styles.container}>
                <FrequencyTimeline
                    baselineArrivals={baselineArrivals}
                    enhancedArrivals={enhancedArrivals}
                    timeRange={timeRange}
                />
                {offset !== null && (
                    <div
                        className={classNames(
                            styles.indicator,
                            !hasSelected && styles.invisible,
                            !isCapturing && styles.animated
                        )}
                        style={{ transform: `translateX(${offset}px)` }}
                    >
                        <div className={styles.indicatorInner}>
                            <div className={styles.topTriangle} />
                            <div className={styles.needle} />
                            <div className={styles.bottomTriangle} />
                        </div>
                    </div>
                )}
            </div>
            <div className={styles.bottom} />
        </div>
    );
};

export default DeparturePicker;
