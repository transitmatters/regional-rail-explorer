import React from "react";
import classNames from "classnames";

import type { ScheduleOptions } from "server/timetableCalculator";

import styles from "./TimetableCalculator.module.scss";

type Props = {
    label: string;
    opts: ScheduleOptions;
    trainsets: string[];
    onChange: (opts: ScheduleOptions) => void;
    accent: "a" | "b";
};

type ToggleKey = Exclude<keyof ScheduleOptions, "trainset">;

const TOGGLES: { key: ToggleKey; label: string; help: string }[] = [
    {
        key: "useFutureRoW",
        label: "Future track speeds",
        help: "Use the higher Vmax planned for each right-of-way segment",
    },
    {
        key: "cap79mph",
        label: "MBTA 79 mph cap",
        help: "Limit all speeds to 79 mph (FRA single-PTC threshold)",
    },
    {
        key: "allHighLevel",
        label: "All high-level platforms",
        help: "Drop every stop dwell to 30 s",
    },
    {
        key: "rushHourLoad",
        label: "Rush hour load",
        help: "Double dwell times to reflect heavy crowding",
    },
    {
        key: "endPadding",
        label: "End padding (5 min)",
        help: "Add the spreadsheet's 300 s schedule pad to the final stop",
    },
];

export const ConfigPanel: React.FC<Props> = ({ label, opts, trainsets, onChange, accent }) => {
    const set = <K extends keyof ScheduleOptions>(k: K, v: ScheduleOptions[K]) =>
        onChange({ ...opts, [k]: v });
    return (
        <div className={classNames(styles.configPanel, styles[`accent-${accent}`])}>
            <div className={styles.panelHeader}>{label}</div>
            <label className={styles.field}>
                <span>Trainset</span>
                <select value={opts.trainset} onChange={(e) => set("trainset", e.target.value)}>
                    {trainsets.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </label>
            <div className={styles.toggleList}>
                {TOGGLES.map((t) => (
                    <label key={t.key} className={styles.toggle} title={t.help}>
                        <input
                            type="checkbox"
                            checked={Boolean(opts[t.key])}
                            onChange={(e) => set(t.key, e.target.checked)}
                        />
                        <span className={styles.toggleLabel}>{t.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};
