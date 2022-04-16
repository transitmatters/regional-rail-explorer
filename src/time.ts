import {
    NetworkTime,
    NetworkDayKind,
    NetworkDay,
    NetworkDayTime,
    Duration,
    NetworkTimeRange,
} from "types";
import { pluralize } from "strings";

export const daysOfWeek: NetworkDay[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
];

export const weekdays = daysOfWeek.slice(0, 5);

export const matchDayOfWeek = (
    dayA: NetworkDay | NetworkDayKind,
    dayB: NetworkDay | NetworkDayKind
) => {
    if (dayA === dayB) {
        return true;
    }
    if (dayA === "weekday") {
        return weekdays.includes(dayB as NetworkDay);
    }
    if (dayB === "weekday") {
        return weekdays.includes(dayA as NetworkDay);
    }
    return false;
};

export const parseTimeRange = (timeRangeString: string): [NetworkTime, NetworkTime] => {
    const [fromTime, toTime] = timeRangeString
        .split("-")
        .map((p) => p.trim())
        .map(parseTime);
    return [fromTime, toTime];
};

export const parseTime = (timeString: string): NetworkTime => {
    const parts = timeString.split(":");
    const [hours, minutes, seconds = 0] = parts.map((x) => parseInt(x));
    return seconds + 60 * (minutes + 60 * hours);
};

export const stringifyTime = (
    time: NetworkTime,
    { truncateLeadingZeros = true, showSeconds = false, use12Hour = false } = {}
): string => {
    let seconds = time,
        minutes = 0,
        hours = 0;
    const minutesToAdd = Math.floor(seconds / 60);
    seconds = seconds % 60;
    minutes = minutes += minutesToAdd;
    const hoursToAdd = Math.floor(minutes / 60);
    minutes = minutes % 60;
    hours += hoursToAdd;
    const isPM = hours >= 12 && hours < 24;
    hours = (use12Hour && hours > 12 ? hours - 12 : hours) % 24;
    // eslint-disable-next-line prefer-const
    let [hoursString, minutesString, secondsString] = [hours, minutes, seconds].map((num) =>
        num.toString().padStart(2, "0")
    );
    if (truncateLeadingZeros && hoursString.startsWith("0")) {
        hoursString = hoursString.slice(1);
    }
    const timeString = [hoursString, minutesString, secondsString]
        .slice(0, showSeconds ? 3 : 2)
        .join(":");
    if (use12Hour) {
        return `${timeString} ${isPM ? "PM" : "AM"}`;
    }
    return timeString;
};

export const stringify12Hour = (time: NetworkTime) => {
    const hours = Math.floor(time / HOUR) % 24;
    const isPM = hours >= 12;
    const resolvedHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${resolvedHours} ${isPM ? "PM" : "AM"}`;
};

export const stringifyDuration = (duration: Duration, useFull = false) => {
    let hours = 0;
    while (duration >= HOUR) {
        duration -= HOUR;
        hours++;
    }
    const minutes = Math.floor(duration / MINUTE);
    const hoursPrefix = hours ? `${hours} ${useFull ? pluralize("hour", hours) : "hr"} ` : "";
    if (hours > 0 && minutes === 0) {
        return hoursPrefix.trim();
    }
    return `${hoursPrefix}${minutes} ${useFull ? pluralize("minute", minutes) : "min"}`;
};

export const createTime = (day: NetworkDay, timeString: string): NetworkDayTime => {
    return {
        day: day,
        time: parseTime(timeString),
    };
};

export const compareTimes = (first: NetworkTime, second: NetworkTime): number => {
    if (first === second) {
        return 0;
    }
    return first > second ? 1 : -1;
};

export const roundToNearestHour = (time: NetworkTime): NetworkTime => {
    const hoursPart = Math.floor(time / HOUR);
    const minutesPart = time % HOUR;
    if (minutesPart >= HOUR / 2) {
        return HOUR * (hoursPart + 1);
    }
    return HOUR * hoursPart;
};

export const snapTime = (time: NetworkTime, period: Duration, sensitivity: Duration) => {
    const periodMod = time % period;
    if (periodMod < sensitivity || periodMod > period - sensitivity) {
        return Math.round(time / period) * period;
    }
    return time;
};

export const getSpanningTimeRange = (
    times: NetworkTime[],
    spanFullDay: boolean = false,
    padding: number = 0
): NetworkTimeRange => {
    if (spanFullDay) {
        return [0 - padding, DAY + padding];
    }
    let min = Infinity;
    let max = -Infinity;
    times.forEach((time) => {
        min = Math.min(time, min);
        max = Math.max(time, max);
    });
    return [roundToNearestHour(min) - padding, roundToNearestHour(max) + padding];
};

export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
