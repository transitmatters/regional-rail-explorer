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
};

const getLeftOffset = (range: NetworkTimeRange, time: NetworkTime): string => {
    const [start, end] = range;
    const percentage = (100 * (time - start)) / (end - start);
    return `${percentage}%`;
};

const getHourTicks = (range: NetworkTimeRange) => {
    const ticks: { time: number; label: string }[] = [];
    const [start, end] = range;
    let now = start;
    while (now < end) {
        ticks.push({
            time: now,
            label: stringify12Hour(now),
        });
        now += HOUR;
    }
    return ticks;
};

const FrequencyTimeline = (props: Props) => {
    const { timeRange, baselineArrivals, enhancedArrivals, showArrivals } = props;

    const renderTicks = () => {
        const ticks = getHourTicks(timeRange);
        return ticks.map((tick) => {
            const { time, label } = tick;
            return (
                <div
                    key={label}
                    className={styles.tick}
                    style={{ left: getLeftOffset(timeRange, time) }}
                >
                    <div className="hairline">
                        <div className="label">{label}</div>
                    </div>
                </div>
            );
        });
    };

    const renderArrivalRow = (times: NetworkTime[], className) => {
        return (
            <div className={styles.row}>
                {times.map((time) => (
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
