export type NetworkDay =
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

export type NetworkDayKind = "weekday" | "saturday" | "sunday";
export type NetworkTime = number;
export type NetworkTimeRange = [NetworkTime, NetworkTime];
export type Duration = number;
export type TimeOfDay = "morning" | "midday" | "evening";

export interface NetworkDayTime {
    time: NetworkTime;
    day: NetworkDay | NetworkDayKind;
}
