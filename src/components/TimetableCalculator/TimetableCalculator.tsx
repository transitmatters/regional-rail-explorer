import React from "react";
import { useRouter } from "next/router";

import { AppFrame } from "components";
import type { ScheduleOptions, ScheduleRow } from "server/timetableCalculator";

import { ConfigPanel } from "./ConfigPanel";
import { TimetableTable } from "./TimetableTable";

import styles from "./TimetableCalculator.module.scss";

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

const formatStart = (s: number): string => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const TimetableCalculator: React.FC<Props> = (props) => {
    const router = useRouter();
    const { serviceNames, trainsetNames, serviceName, startTimeSeconds, a, b } = props;

    const updateQuery = (patch: Record<string, string | undefined>) => {
        const next = { ...router.query, ...patch };
        for (const k of Object.keys(next)) {
            if (next[k] === undefined) delete next[k];
        }
        router.push({ pathname: router.pathname, query: next }, undefined, {
            scroll: false,
        });
    };

    const setOpts = (side: "a" | "b", opts: ScheduleOptions) => {
        updateQuery({
            [`${side}.trainset`]: opts.trainset,
            [`${side}.future`]: opts.useFutureRoW ? "1" : "0",
            [`${side}.cap79`]: opts.cap79mph ? "1" : "0",
            [`${side}.high`]: opts.allHighLevel ? "1" : "0",
            [`${side}.rush`]: opts.rushHourLoad ? "1" : "0",
            [`${side}.pad`]: opts.endPadding ? "1" : "0",
        });
    };

    return (
        <AppFrame containerClassName={styles.page}>
            <div className={styles.hero}>
                <div className={styles.heroInner}>
                    <h1>Timetable Calculator</h1>
                    <p>
                        Compare two configurations of a commuter rail service side by side.
                        Adjust trainset and infrastructure assumptions on either column to see
                        where time is gained or lost stop by stop.
                    </p>
                </div>
            </div>

            <div className={styles.body}>
                <div className={styles.controlsRow}>
                    <label className={styles.field}>
                        <span>Service</span>
                        <select
                            value={serviceName}
                            onChange={(e) => updateQuery({ service: e.target.value })}
                        >
                            {serviceNames.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Departure</span>
                        <input
                            type="time"
                            value={formatStart(startTimeSeconds)}
                            onChange={(e) => updateQuery({ start: e.target.value })}
                        />
                    </label>
                </div>

                <div className={styles.configRow}>
                    <ConfigPanel
                        label="Configuration A"
                        opts={a.opts}
                        trainsets={trainsetNames}
                        onChange={(o) => setOpts("a", o)}
                        accent="a"
                    />
                    <ConfigPanel
                        label="Configuration B"
                        opts={b.opts}
                        trainsets={trainsetNames}
                        onChange={(o) => setOpts("b", o)}
                        accent="b"
                    />
                </div>

                <TimetableTable
                    aRows={a.rows}
                    bRows={b.rows}
                    startTimeSeconds={startTimeSeconds}
                />
            </div>
        </AppFrame>
    );
};
