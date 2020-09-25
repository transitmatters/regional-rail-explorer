import { NetworkTime } from "./types";
import { parseTimeRange, parseTime, HOUR, MINUTE } from "./time";

type FrequencySchedule = {
    [timeString: string]: number;
};

export const generateTimesByClockfaceSchedule = (
    schedule: FrequencySchedule,
    clockfaceOffsetMinutes: number = 0
): NetworkTime[] => {
    const times = [];
    let previousRangeEnd = null;

    Object.entries(schedule).forEach(([timeOrRangeString, frequency]) => {
        const interval = HOUR / frequency;
        const isRange = timeOrRangeString.includes("-");
        const [rangeStart, rangeEnd] = isRange
            ? parseTimeRange(timeOrRangeString)
            : [previousRangeEnd, parseTime(timeOrRangeString)];
        const latest = times[times.length - 1] || rangeStart + MINUTE * clockfaceOffsetMinutes;
        let now = previousRangeEnd ? previousRangeEnd + interval : latest;
        while (now <= rangeEnd) {
            times.push(now);
            now += interval;
        }
        previousRangeEnd = rangeEnd;
    });

    return times;
};
