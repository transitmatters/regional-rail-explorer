# Timetable Calculator engine

Port of TransitMatters' [Timetable Calculator v2](https://docs.google.com/spreadsheets/d/18uDxE2uhldgV6RMUNBR17LuecAX8RPhgl8XkS_Res4U) Google Sheet. The Sheet remains the source of truth; CSVs in `data/timetable-calculator/` are sync'd via `scripts/fetchTimetableCalcData.mjs`.

## Verification

`scripts/verifyTimetableEngine.ts` runs the engine against the spreadsheet's own `Schedule_set1` and `Schedule_set2` fixture tabs (Providence Local, two trainset/toggle combinations). Current per-stop `cumul_time` deviation is **≤0.25 s end-to-end** — the residual is just the spreadsheet displaying values rounded to two decimals while we compute at full precision.

## Known POC limitations (revisit before broadening past Providence Local)

1. **Spreadsheet-faithful `accel_time` quirk.** The model adds the *full* time to accelerate from 0 → segmentTopV at every segment that has `total_accel_dist > 0`, regardless of `start_V`. This effectively pre-pays the re-acceleration time of each stop inside the stop's own segment, then the next RoW *also* accelerates from 0 — so each stop adds ~28 s relative to clean kinematics. We replicate this faithfully so outputs match the existing calculator. If we ever expose a "realistic physics" mode, this is the place to fix.

2. **Asymmetric decel formulas.** `decel_dist` uses `start_V → end_V`, but `decel_time` uses `decel_max_V → end_V`. These are equal for almost every segment; r28 of Providence Local is the one where they diverge, and the spreadsheet's choice is what we mirror.

3. **Stops always use `Future_speed` for Vmax.** The "Current vs Future RoW" toggle only swings RoW track speeds. Stop platform Vmax is treated as a track-design property and stays fixed at the stop's `Future_speed` value. This is a spreadsheet convention; if it changes, fix in `load.ts`'s `resolveServiceVmax`.

4. **Service coverage.** The Sheet only fully populates Providence Local (and a partial East-West skeleton without speed data). Filling in the other commuter rail lines is data work, not engine work.

5. **Direction symmetry.** `RoW.csv` carries notes like "Outbound 80, inbound 60?" — the engine currently treats track speeds as direction-agnostic, matching the Sheet. If we add inbound timetables, this needs revisiting.

6. **Floating-point epsilon in `accel_time`.** Stops where `dist_after_decel ≈ 0` produce a tiny non-zero `total_accel_dist` from `Math.cbrt` rounding. We guard with `> 1e-6`. Worth tightening if we move to more precise reference math.

## Files

- `types.ts` — `Trainset`, `StopRef`, `RoWRef`, `Service`, `ScheduleOptions`, `ScheduleRow`.
- `load.ts` — reads CSVs from `data/timetable-calculator/`. Derives `accel = F/m` and `transitionV = P/F` for trainsets; resolves segment Vmax from referenced stops/RoW.
- `schedule.ts` — `runSchedule(data, serviceName, opts) → ScheduleRow[]`. Walks segments forward after a backward pass that fills `decel_max_V`.
