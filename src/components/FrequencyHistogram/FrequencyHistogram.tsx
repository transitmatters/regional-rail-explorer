import React, { useState } from "react";

import { NetworkTime, NetworkTimeRange } from "types";
import { HOUR, DAY, MINUTE, stringifyTime } from "time";

import styles from "./FrequencyHistogram.module.scss";

type Props = {
    baselineArrivals: NetworkTime[];
    enhancedArrivals: NetworkTime[];
    bucketMinMinutes?: number;
    bucketMaxMinutes?: number;
    spanFullDay?: boolean;
};

const MIN_BUCKET_WIDTH_PX = 35;

const roundToNearestHour = (time: NetworkTime): NetworkTime => {
    const hoursPart = Math.floor(time / HOUR);
    const minutesPart = time % HOUR;
    if (minutesPart >= HOUR / 2) {
        return HOUR * (hoursPart + 1);
    }
    return HOUR * hoursPart;
};

const getTimeRange = (allArrivals: NetworkTime[], spanFullDay: boolean): NetworkTimeRange => {
    if (spanFullDay) {
        return [0, DAY];
    }
    let min = Infinity;
    let max = -Infinity;
    allArrivals.forEach((time) => {
        min = Math.min(time, min);
        max = Math.max(time, max);
    });
    return [roundToNearestHour(min), roundToNearestHour(max)];
};

const getBuckets = (
    timeRange: NetworkTimeRange,
    bucketMinMinutes: number,
    bucketMaxMinutes: number,
    widthPx: number
): NetworkTimeRange[] => {
    const [startTime, endTime] = timeRange;
    const buckets: [number, number][] = [];
    const timeMinutesWidth = (endTime - startTime) / MINUTE;
    let bucketWidthMinutes = bucketMinMinutes;
    while (true) {
        if (bucketWidthMinutes > bucketMaxMinutes) {
            bucketWidthMinutes = bucketMaxMinutes;
            break;
        }
        const numBuckets = Math.ceil(timeMinutesWidth / bucketWidthMinutes);
        if (numBuckets * MIN_BUCKET_WIDTH_PX <= widthPx) {
            break;
        } else {
            bucketWidthMinutes *= 2;
        }
    }
    let now = startTime;
    const interval = bucketWidthMinutes * MINUTE;
    while (now < endTime) {
        buckets.push([now, now + interval]);
        now += interval;
    }
    return buckets;
};

const isInBucket = (bucket: NetworkTimeRange, time: NetworkTime) => {
    const [start, end] = bucket;
    return time >= start && time < end;
};

const bucketArrivals = (
    buckets: NetworkTimeRange[],
    baselineArrivals: NetworkTime[],
    enhancedArrivals: NetworkTime[]
) => {
    return buckets.map((bucket) => {
        const baseline = baselineArrivals.filter((t) => isInBucket(bucket, t));
        const enhanced = enhancedArrivals.filter((t) => isInBucket(bucket, t));
        return {
            bucket,
            baselineCount: baseline.length,
            enhancedCount: enhanced.length,
        };
    });
};

const FrequencyHistogram = ({
    spanFullDay = false,
    baselineArrivals,
    enhancedArrivals,
    bucketMinMinutes = 60,
    bucketMaxMinutes = 120,
}: Props) => {
    const [width, setWidth] = useState<null | number>(null);

    const renderInner = () => {
        if (width === null) {
            return null;
        }
        const timeRange = getTimeRange([...baselineArrivals, ...enhancedArrivals], spanFullDay);
        const buckets = getBuckets(timeRange, bucketMinMinutes, bucketMaxMinutes, width);
        const bucketedArrivals = bucketArrivals(buckets, baselineArrivals, enhancedArrivals);
        return bucketedArrivals.map((entry) => {
            const { baselineCount, enhancedCount, bucket } = entry;
            const [startTime] = bucket;
            const totalInBucket = Math.max(baselineCount, enhancedCount);
            const children = Array(totalInBucket)
                .fill(0)
                .map((_, index) => {
                    const isEnhanced = totalInBucket - index > baselineCount;
                    return (
                        <div
                            key={index}
                            className={isEnhanced ? styles.enhancedArrival : styles.arrival}
                        />
                    );
                });
            return (
                <div className={styles.bucket} key={startTime}>
                    <span className="time">{stringifyTime(startTime)}</span>
                    {children}
                </div>
            );
        });
    };

    return (
        <div
            ref={(el) => el && setWidth(el.getBoundingClientRect().width)}
            className={styles.histogram}
        >
            {renderInner()}
        </div>
    );
};

export default FrequencyHistogram;
