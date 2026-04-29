import type { GetServerSideProps } from "next";

import { TimetableCalculator } from "components/TimetableCalculator";
import {
    loadReferenceData,
    runSchedule,
    ScheduleOptions,
    ScheduleRow,
} from "server/timetableCalculator";

export type ConfigSide = "a" | "b";

type SideResult = {
    rows: ScheduleRow[];
    opts: ScheduleOptions;
};

type Props = {
    serviceNames: string[];
    trainsetNames: string[];
    serviceName: string;
    startTimeSeconds: number;
    a: SideResult;
    b: SideResult;
};

const DEFAULTS = {
    service: "Providence Local",
    start: 17 * 3600 + 37 * 60, // 17:37 — matches the spreadsheet's example
    a: {
        trainset: "MBTA Diesel",
        useFutureRoW: false,
        cap79mph: false,
        allHighLevel: false,
        rushHourLoad: false,
        endPadding: true,
    } satisfies ScheduleOptions,
    b: {
        trainset: "Siemens Charger [Electric mode]",
        useFutureRoW: true,
        cap79mph: false,
        allHighLevel: false,
        rushHourLoad: false,
        endPadding: false,
    } satisfies ScheduleOptions,
};

const parseBool = (v: string | undefined, fallback: boolean) =>
    v === undefined ? fallback : v === "1" || v === "true";

const parseStart = (v: string | undefined): number => {
    if (!v) return DEFAULTS.start;
    const m = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return DEFAULTS.start;
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0);
};

const optsForSide = (
    query: Record<string, string | string[] | undefined>,
    side: ConfigSide
): ScheduleOptions => {
    const get = (k: string) => {
        const v = query[`${side}.${k}`];
        return Array.isArray(v) ? v[0] : v;
    };
    const def = DEFAULTS[side];
    return {
        trainset: get("trainset") ?? def.trainset,
        useFutureRoW: parseBool(get("future"), def.useFutureRoW),
        cap79mph: parseBool(get("cap79"), def.cap79mph),
        allHighLevel: parseBool(get("high"), def.allHighLevel),
        rushHourLoad: parseBool(get("rush"), def.rushHourLoad),
        endPadding: parseBool(get("pad"), def.endPadding),
    };
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
    const data = loadReferenceData();
    const serviceQ = query.service;
    const requestedService = Array.isArray(serviceQ) ? serviceQ[0] : serviceQ;
    const serviceName =
        requestedService && data.services.has(requestedService)
            ? requestedService
            : DEFAULTS.service;

    const startQ = query.start;
    const startTimeSeconds = parseStart(Array.isArray(startQ) ? startQ[0] : startQ);

    const aOpts = optsForSide(query, "a");
    const bOpts = optsForSide(query, "b");

    return {
        props: {
            serviceNames: [...data.services.keys()].sort(),
            trainsetNames: [...data.trainsets.keys()],
            serviceName,
            startTimeSeconds,
            a: { rows: runSchedule(data, serviceName, aOpts), opts: aOpts },
            b: { rows: runSchedule(data, serviceName, bOpts), opts: bOpts },
        },
    };
};

export default function TimetableCalculatorPage(props: Props) {
    return <TimetableCalculator {...props} />;
}
