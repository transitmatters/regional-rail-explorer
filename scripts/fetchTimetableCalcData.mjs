#!/usr/bin/env node
// Pulls reference tabs from the Timetable Calculator v2 Google Sheet and
// writes normalized CSVs to data/timetable-calculator/. The Sheet is the
// source of truth; re-run this script to refresh the local baseline.
//
//   https://docs.google.com/spreadsheets/d/18uDxE2uhldgV6RMUNBR17LuecAX8RPhgl8XkS_Res4U
//
// Usage: node scripts/fetchTimetableCalcData.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Minimal CSV parser — handles quoted fields with embedded commas, quotes
// (escaped as "") and newlines. The gviz endpoint always quotes string cells.
const parse = (csv) => {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < csv.length; i++) {
        const c = csv[i];
        if (inQuotes) {
            if (c === '"') {
                if (csv[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ",") {
            row.push(field);
            field = "";
        } else if (c === "\n" || c === "\r") {
            if (c === "\r" && csv[i + 1] === "\n") i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else {
            field += c;
        }
    }
    if (field !== "" || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows;
};

// Minimal CSV writer — quote any field containing comma, quote, or newline.
const stringify = (rows) =>
    rows
        .map((r) =>
            r
                .map((cell) => {
                    const s = cell == null ? "" : String(cell);
                    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
                })
                .join(","),
        )
        .join("\n") + "\n";

const SHEET_ID = "18uDxE2uhldgV6RMUNBR17LuecAX8RPhgl8XkS_Res4U";
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "timetable-calculator");

// gviz exports cell values with their formatted unit suffix (e.g. "467000 kg",
// "30.00 s", "100.00 mph"). Strip a known unit and return a plain number string.
const UNIT_RE = /^\s*(-?\d+(?:\.\d+)?)\s*(?:kg|N|W|s|m|mph|km\/h|m\/s2|m\/s)?\s*$/;
const stripUnit = (v) => {
    if (typeof v !== "string") return v;
    const m = v.match(UNIT_RE);
    return m ? m[1] : v;
};

const fetchTab = async (sheetName) => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${sheetName}: ${res.status}`);
    return res.text();
};

// Drop trailing all-empty columns (gviz pads to the sheet's max column count).
const trimColumns = (rows) => {
    if (rows.length === 0) return rows;
    const width = rows[0].length;
    let last = width;
    while (last > 0 && rows.every((r) => !r[last - 1] || r[last - 1].trim() === "")) {
        last--;
    }
    return rows.map((r) => r.slice(0, last));
};

const numericCols = {
    trainsets: ["Mass", "Force", "Power", "Vmax", "Braking_rate", "Acceleration", "Transition_V", "Seats"],
    standards: ["Dwell time"],
    stops: ["Dwell_time", "Platform_Length", "Current_speed", "Current_V", "Future_speed", "Future_V"],
    rows: ["Distance", "Current_Speed", "Current_Vmax", "Future_Speed", "Future_Vmax"],
    services: ["Segment_ord", "Dist", "Vmax", "Current_Vmax", "Future_Vmax"],
};

const cleanTab = (csv, numericColumns) => {
    let rows = parse(csv, { skip_empty_lines: false });
    rows = trimColumns(rows);
    const [header, ...body] = rows;
    const numericIdx = new Set(
        numericColumns.map((c) => header.indexOf(c)).filter((i) => i >= 0),
    );
    const cleanedBody = body
        .filter((r) => r.some((cell) => cell && cell.trim() !== ""))
        .map((r) => r.map((cell, i) => (numericIdx.has(i) ? stripUnit(cell) : cell)));
    return [header, ...cleanedBody];
};

const writeCsv = async (filename, rows) => {
    const out = stringify(rows);
    await writeFile(join(OUT_DIR, filename), out);
    console.log(`  wrote ${filename}  (${rows.length - 1} rows)`);
};

const TABS = [
    { sheet: "Trainsets", file: "trainsets.csv", numeric: numericCols.trainsets },
    { sheet: "Standards", file: "platform-standards.csv", numeric: numericCols.standards },
    { sheet: "Stops", file: "stops.csv", numeric: numericCols.stops },
    { sheet: "RoW", file: "rows.csv", numeric: numericCols.rows },
    { sheet: "Service", file: "services.csv", numeric: numericCols.services },
];

const FIXTURE_TABS = [
    { sheet: "Schedule_set1", file: "fixtures/schedule_set1.csv" },
    { sheet: "Schedule_set2", file: "fixtures/schedule_set2.csv" },
];

const main = async () => {
    await mkdir(OUT_DIR, { recursive: true });
    await mkdir(join(OUT_DIR, "fixtures"), { recursive: true });

    console.log(`Fetching from Sheet ${SHEET_ID}`);
    for (const { sheet, file, numeric } of TABS) {
        const csv = await fetchTab(sheet);
        const cleaned = cleanTab(csv, numeric);
        await writeCsv(file, cleaned);
    }

    // Fixtures are the spreadsheet's own per-segment kinematic outputs for two
    // configurations of "Providence Local" — we keep them verbatim (units and
    // all) so the engine port can be regression-tested against the source.
    for (const { sheet, file } of FIXTURE_TABS) {
        const csv = await fetchTab(sheet);
        await writeFile(join(OUT_DIR, file), csv);
        console.log(`  wrote ${file}  (raw)`);
    }

    console.log("Done.");
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
