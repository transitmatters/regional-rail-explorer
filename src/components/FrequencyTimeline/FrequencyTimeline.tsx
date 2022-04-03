import React from "react";
import classNames from "classnames";

import { NetworkTime, NetworkTimeRange } from "types";
import { HOUR, stringify12Hour } from "time";

import styles from "./FrequencyTimeline.module.scss";

export type Props = {
    baselineArrivals: NetworkTime[];
    enhancedArrivals: NetworkTime[];
    timeRange: NetworkTimeRange;
    showArrivals: boolean;
    includeQuarterHourTicks?: boolean;
};

type Tick = {
    time: NetworkTime;
    label: null | string;
    isFullSize: boolean;
};

const getLeftOffset = (range: NetworkTimeRange, time: NetworkTime): string => {
    const [start, end] = range;
    const percentage = (100 * (time - start)) / (end - start);
    return `${percentage}%`;
};

const getTicks = (range: NetworkTimeRange, ticksPerHour: number) => {
    const ticks: Tick[] = [];
    const [start, end] = range;
    const interval = HOUR / ticksPerHour;
    let time = start;
    while (time < end) {
        const isFullSize = time % HOUR === 0;
        const label = isFullSize ? stringify12Hour(time) : null;
        ticks.push({ time, label, isFullSize });
        time += interval;
    }
    return ticks;
};

const FrequencyTimeline = (props: Props) => {
    const {
        timeRange,
        baselineArrivals,
        enhancedArrivals,
        showArrivals,
        includeQuarterHourTicks = false,
    } = props;

    const renderTicks = () => {
        const ticks = getTicks(timeRange, includeQuarterHourTicks ? 4 : 1);
        return ticks.map((tick) => {
            const { time, label, isFullSize } = tick;
            return (
                <div
                    key={time}
                    className={classNames(styles.tick, isFullSize && styles.fullSizeTick)}
                    style={{ left: getLeftOffset(timeRange, time) }}
                >
                    <div className="hairline">
                        <div className="label">{label}</div>
                    </div>
                </div>
            );
        });
    };

    const renderArrivalRow = (times: NetworkTime[], className: string) => {
        return (
            <div className={styles.row}>
                {[...new Set(times)].map((time) => (
                    <div
                        key={time}
                        className={className}
                        style={{ left: getLeftOffset(timeRange, time) }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className={classNames(styles.timeline, showArrivals && styles.withArrivals)}>
            {renderTicks()}
            {showArrivals && (
                <>
                    {renderArrivalRow(baselineArrivals, styles.baselineArrival)}
                    {renderArrivalRow(enhancedArrivals, styles.enhancedArrival)}
                </>
            )}
        </div>
    );
};

export default FrequencyTimeline;
