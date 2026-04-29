import React from "react";
import classNames from "classnames";

import type { ScheduleRow } from "server/timetableCalculator";

import styles from "./TimetableCalculator.module.scss";

type Props = {
    aRows: ScheduleRow[];
    bRows: ScheduleRow[];
    startTimeSeconds: number;
};

const formatClock = (totalSeconds: number): string => {
    const t = Math.round(totalSeconds);
    const h = Math.floor(t / 3600) % 24;
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatDelta = (seconds: number): string => {
    if (Math.abs(seconds) < 0.5) return "—";
    const sign = seconds >= 0 ? "+" : "−";
    const abs = Math.round(Math.abs(seconds));
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${sign}${m}:${String(s).padStart(2, "0")}`;
};

const formatMiles = (meters: number): string => (meters / 1609.344).toFixed(2);

export const TimetableTable: React.FC<Props> = ({ aRows, bRows, startTimeSeconds }) => {
    // Pair rows by ord so we can always match the two configurations.
    const stops = aRows.filter((r) => r.type === "Stop");
    const bByOrd = new Map(bRows.map((r) => [r.ord, r]));

    const finalA = aRows[aRows.length - 1];
    const finalB = bRows[bRows.length - 1];
    const totalDelta = finalB.cumulTime - finalA.cumulTime;

    return (
        <div className={styles.tableWrap}>
            <div className={styles.summary}>
                <div>
                    <span className={styles.summaryLabel}>Total time A</span>
                    <span className={styles.summaryValue}>
                        {Math.round(finalA.cumulTime / 60)} min
                    </span>
                </div>
                <div>
                    <span className={styles.summaryLabel}>Total time B</span>
                    <span className={styles.summaryValue}>
                        {Math.round(finalB.cumulTime / 60)} min
                    </span>
                </div>
                <div>
                    <span className={styles.summaryLabel}>B vs A</span>
                    <span
                        className={classNames(styles.summaryValue, {
                            [styles.faster]: totalDelta < 0,
                            [styles.slower]: totalDelta > 0,
                        })}
                    >
                        {formatDelta(totalDelta)}
                    </span>
                </div>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Station</th>
                        <th className={styles.numeric}>mi</th>
                        <th className={styles.numeric}>A arrives</th>
                        <th className={styles.numeric}>B arrives</th>
                        <th className={styles.numeric}>B − A</th>
                    </tr>
                </thead>
                <tbody>
                    {stops.map((a) => {
                        const b = bByOrd.get(a.ord);
                        if (!b) return null;
                        const skipA = !a.stopHere;
                        const skipB = !b.stopHere;
                        const delta = b.cumulTime - a.cumulTime;
                        return (
                            <tr
                                key={a.ord}
                                className={classNames({
                                    [styles.skipBoth]: skipA && skipB,
                                })}
                            >
                                <td>{a.segment}</td>
                                <td className={styles.numeric}>{formatMiles(a.cumulDist)}</td>
                                <td className={styles.numeric}>
                                    {skipA ? (
                                        <span className={styles.skip}>skip</span>
                                    ) : (
                                        formatClock(startTimeSeconds + a.cumulTime)
                                    )}
                                </td>
                                <td className={styles.numeric}>
                                    {skipB ? (
                                        <span className={styles.skip}>skip</span>
                                    ) : (
                                        formatClock(startTimeSeconds + b.cumulTime)
                                    )}
                                </td>
                                <td
                                    className={classNames(styles.numeric, {
                                        [styles.faster]: delta < -0.5,
                                        [styles.slower]: delta > 0.5,
                                    })}
                                >
                                    {formatDelta(delta)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
