#!/usr/bin/env node
// Compares the ported kinematic engine to the spreadsheet's own per-segment
// outputs in data/timetable-calculator/fixtures/schedule_set1.csv.
//
// Run with:  npx ts-node --esm scripts/verifyTimetableEngine.mts
//        or: node --import ts-node/esm scripts/verifyTimetableEngine.mts

import fs from "fs";
import path from "path";

import { loadReferenceData } from "../src/server/timetableCalculator/load";
import { runSchedule } from "../src/server/timetableCalculator/schedule";

// Schedule_set1: "Providence Local" / outbound / MBTA Diesel / current speeds
//   / no 79mph cap / no high-level / no rush / end padding TRUE.
// Schedule_set2: same service / Siemens Charger Electric / future speeds /
//   no caps / no rush / end padding FALSE.
const FIXTURES = [
    {
        file: "schedule_set1.csv",
        serviceName: "Providence Local",
        opts: {
            trainset: "MBTA Diesel",
            useFutureRoW: false,
            cap79mph: false,
            allHighLevel: false,
            rushHourLoad: false,
            endPadding: true,
        },
    },
    {
        file: "schedule_set2.csv",
        serviceName: "Providence Local",
        opts: {
            trainset: "Siemens Charger [Electric mode]",
            useFutureRoW: true,
            cap79mph: false,
            allHighLevel: false,
            rushHourLoad: false,
            endPadding: false,
        },
    },
] as const;

const stripUnit = (s: string): number => {
    const m = s.match(/^\s*(-?\d+(?:\.\d+)?)/);
    return m ? Number(m[1]) : NaN;
};

const verifyFixture = (
    data: ReturnType<typeof loadReferenceData>,
    fixture: (typeof FIXTURES)[number],
): number => {
    const ours = runSchedule(data, fixture.serviceName, fixture.opts);
    const fixturePath = path.join(
        process.cwd(),
        "data/timetable-calculator/fixtures",
        fixture.file,
    );
    const raw = fs.readFileSync(fixturePath, "utf8");
    const rows = raw
        .split(/\r?\n/)
        .filter((l) => l.trim() !== "")
        .map(
            (l) =>
                l
                    .match(/("(?:[^"]|"")*"|[^,]*)(?:,|$)/g)
                    ?.map((c) => c.replace(/^,?"?|"?,?$/g, "")) ?? [],
        );
    const headerIdx = rows.findIndex((r) => r[0] === "Segment");
    const dataRows = rows.slice(headerIdx + 1).filter((r) => r[0]);

    console.log(`\n=== ${fixture.file} (${fixture.opts.trainset}, future=${fixture.opts.useFutureRoW}, padding=${fixture.opts.endPadding}) ===`);
    const stops = ours.filter((r) => r.stopHere);
    let maxDelta = 0;
    for (const r of stops) {
        const fixRow = dataRows.find((fr) => fr[0] === r.segment);
        if (!fixRow) continue;
        const fixCumul = stripUnit(fixRow[30]);
        const delta = r.cumulTime - fixCumul;
        maxDelta = Math.max(maxDelta, Math.abs(delta));
        console.log(
            `  ${r.segment.padEnd(28)}  fix=${fixCumul.toFixed(2).padStart(8)}  ours=${r.cumulTime.toFixed(2).padStart(8)}  Δ=${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`,
        );
    }
    console.log(`  Max |delta|: ${maxDelta.toFixed(2)} s`);
    return maxDelta;
};

const main = () => {
    const data = loadReferenceData();
    let worst = 0;
    for (const f of FIXTURES) {
        worst = Math.max(worst, verifyFixture(data, f));
    }
    console.log(`\nOverall worst delta across all fixtures: ${worst.toFixed(2)} s`);
};

main();
