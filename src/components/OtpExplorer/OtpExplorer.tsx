import React, { useEffect, useMemo, useState } from "react";
import { CgSpinner } from "react-icons/cg";

import { JourneyTimeline, AppFrame } from "components";
import { NetworkDayKind, NetworkTime, NavigationKind, JourneySegment } from "types";
import { HOUR, MINUTE, stringifyDuration, stringifyTime } from "time";
import { usePendingPromise, useRouterBoundState } from "hooks";

import AddressJourneyPicker from "../AddressJourneyPicker/AddressJourneyPicker";
import { AddressSelection } from "../AddressAutocomplete/AddressAutocomplete";
import ComparisonRow from "../JourneyComparison/ComparisonRow";

import styles from "./OtpExplorer.module.scss";

type OtpLeg = {
    mode: string;
    startTime: number;
    endTime: number;
    duration: number;
    distance: number;
    routeId?: string;
    route?: string;
    tripId?: string;
    from: { name: string; stopId?: string };
    to: { name: string; stopId?: string };
    intermediateStops?: { name: string; departureTime: number }[];
};

type OtpItinerary = {
    duration: number;
    startTime: number;
    endTime: number;
    legs: OtpLeg[];
};

const toNetworkTime = (epochMs: number): NetworkTime => {
    const date = new Date(epochMs);
    return date.getHours() * HOUR + date.getMinutes() * MINUTE + date.getSeconds();
};

const getNextDateForDayKind = (dayKind: NetworkDayKind) => {
    const today = new Date();
    const desiredDay =
        dayKind === "weekday"
            ? null
            : dayKind === "saturday"
            ? 6
            : dayKind === "sunday"
            ? 0
            : null;
    if (desiredDay === null) {
        const day = today.getDay();
        const offset = day === 0 ? 1 : day === 6 ? 2 : 0;
        const next = new Date(today);
        next.setDate(today.getDate() + offset);
        return next;
    }
    const diff = (desiredDay + 7 - today.getDay()) % 7;
    const next = new Date(today);
    next.setDate(today.getDate() + (diff === 0 ? 7 : diff));
    return next;
};

const formatOtpDate = (date: Date) => date.toISOString().slice(0, 10);

const formatOtpTime = (time: NetworkTime) => {
    const hours = Math.floor(time / HOUR)
        .toString()
        .padStart(2, "0");
    const minutes = Math.floor((time % HOUR) / MINUTE)
        .toString()
        .padStart(2, "0");
    return `${hours}:${minutes}`;
};

const formatOtpModeLabel = (mode: string | undefined) => {
    if (!mode) {
        return null;
    }
    const label = mode.toLowerCase();
    return label.charAt(0).toUpperCase() + label.slice(1);
};

const getItineraryDuration = (itinerary: OtpItinerary) => {
    if (typeof itinerary.duration === "number") {
        return itinerary.duration;
    }
    if (typeof itinerary.startTime === "number" && typeof itinerary.endTime === "number") {
        return Math.max(0, Math.round((itinerary.endTime - itinerary.startTime) / 1000));
    }
    return Number.POSITIVE_INFINITY;
};

const getItineraryEndTime = (itinerary: OtpItinerary) => {
    if (typeof itinerary.endTime === "number") {
        return itinerary.endTime;
    }
    if (typeof itinerary.startTime === "number" && typeof itinerary.duration === "number") {
        return itinerary.startTime + itinerary.duration * 1000;
    }
    return Number.POSITIVE_INFINITY;
};

const selectBestItinerary = (
    itineraries: OtpItinerary[],
    navigationKind: NavigationKind,
    desiredArrivalMs: number | null
) => {
    if (!itineraries.length) {
        return null;
    }
    if (navigationKind === "arrive-by" && desiredArrivalMs !== null) {
        const beforeArrival = itineraries.filter(
            (itinerary) => getItineraryEndTime(itinerary) <= desiredArrivalMs
        );
        const pool = beforeArrival.length ? beforeArrival : itineraries;
        return pool.reduce((best, current) => {
            const bestEnd = getItineraryEndTime(best);
            const currentEnd = getItineraryEndTime(current);
            if (beforeArrival.length) {
                const bestDelta = desiredArrivalMs - bestEnd;
                const currentDelta = desiredArrivalMs - currentEnd;
                if (currentDelta < bestDelta) {
                    return current;
                }
                if (currentDelta > bestDelta) {
                    return best;
                }
            } else {
                if (currentEnd < bestEnd) {
                    return current;
                }
                if (currentEnd > bestEnd) {
                    return best;
                }
            }
            return getItineraryDuration(current) < getItineraryDuration(best) ? current : best;
        }, pool[0]);
    }

    return itineraries.reduce((best, current) => {
        const bestEnd = getItineraryEndTime(best);
        const currentEnd = getItineraryEndTime(current);
        if (currentEnd < bestEnd) {
            return current;
        }
        if (currentEnd > bestEnd) {
            return best;
        }
        return getItineraryDuration(current) < getItineraryDuration(best) ? current : best;
    }, itineraries[0]);
};

const mapOtpItinerary = (itinerary: OtpItinerary): JourneySegment[] => {
    const segments: JourneySegment[] = [];
    const legs = itinerary.legs || [];
    let previousEnd: number | null = null;

    legs.forEach((leg) => {
        if (previousEnd !== null && leg.startTime > previousEnd) {
            const waitSeconds = Math.round((leg.startTime - previousEnd) / 1000);
            segments.push({
                kind: "transfer",
                startTime: toNetworkTime(previousEnd),
                endTime: toNetworkTime(leg.startTime),
                waitDuration: waitSeconds,
                walkDuration: 0,
            });
        }

        if (leg.mode === "WALK") {
            segments.push({
                kind: "transfer",
                startTime: toNetworkTime(leg.startTime),
                endTime: toNetworkTime(leg.endTime),
                waitDuration: 0,
                walkDuration: Math.round(leg.duration),
                walkDistance: Number.isFinite(leg.distance) ? leg.distance : undefined,
            });
        } else {
            const routeLabel = leg.route;
            const modeLabel = formatOtpModeLabel(leg.mode);
            const displayRouteLabel =
                routeLabel && modeLabel
                    ? `${modeLabel} ${routeLabel}`
                    : routeLabel || modeLabel || undefined;
            segments.push({
                kind: "travel",
                startTime: toNetworkTime(leg.startTime),
                endTime: toNetworkTime(leg.endTime),
                startStation: {
                    id: leg.from.stopId || leg.from.name,
                    name: leg.from.name,
                },
                endStation: {
                    id: leg.to.stopId || leg.to.name,
                    name: leg.to.name,
                },
                passedStations: (leg.intermediateStops || []).map((stop) => ({
                    time: toNetworkTime(stop.departureTime),
                    station: { id: stop.name, name: stop.name },
                })),
                routeId: leg.routeId || leg.route || leg.mode,
                routePatternId: leg.tripId || leg.routeId || leg.route || leg.mode,
                routeLabel: displayRouteLabel,
                levelBoarding: false,
            });
        }

        previousEnd = leg.endTime;
    });

    return segments;
};

type RouterScenario = {
    id: "present" | "regional_rail";
    name: string;
    router: string;
};

type OtpResult = {
    itinerary: OtpItinerary | null;
    segments: JourneySegment[];
    error: string | null;
};

const presentRouter = process.env.NEXT_PUBLIC_OTP_ROUTER_PRESENT || "default";
const regionalRouter = process.env.NEXT_PUBLIC_OTP_ROUTER_REGIONAL || presentRouter;

const scenarios: RouterScenario[] = [
    { id: "present", name: "Today's commuter rail", router: presentRouter },
    { id: "regional_rail", name: "Electrified regional rail", router: regionalRouter },
];

const OtpExplorer: React.FunctionComponent = () => {
    const [
        {
            fromAddress,
            toAddress,
            fromLat,
            fromLon,
            toLat,
            toLon,
            day,
            time,
            navigationKind = "depart-at",
        },
        updateJourneyParams,
    ] = useRouterBoundState(
        {
            fromAddress: { initial: "" as string, param: "fromAddress" },
            toAddress: { initial: "" as string, param: "toAddress" },
            fromLat: {
                initial: null as null | number,
                param: "fromLat",
                decode: parseFloat,
                encode: (value) => (Number.isFinite(value) ? value.toString() : ""),
            },
            fromLon: {
                initial: null as null | number,
                param: "fromLon",
                decode: parseFloat,
                encode: (value) => (Number.isFinite(value) ? value.toString() : ""),
            },
            toLat: {
                initial: null as null | number,
                param: "toLat",
                decode: parseFloat,
                encode: (value) => (Number.isFinite(value) ? value.toString() : ""),
            },
            toLon: {
                initial: null as null | number,
                param: "toLon",
                decode: parseFloat,
                encode: (value) => (Number.isFinite(value) ? value.toString() : ""),
            },
            day: { initial: "weekday" as NetworkDayKind, param: "day" },
            time: {
                initial: 9 * HOUR as number,
                param: "time",
                decode: parseInt,
                encode: (t) => t?.toString(),
            },
            navigationKind: {
                initial: "depart-at" as NavigationKind,
                param: "navigationKind",
            },
        },
        () => ({ shallow: true, replace: true })
    );

    const [results, setResults] = useState<Record<string, OtpResult>>({});
    const [error, setError] = useState<string | null>(null);
    const [isPending, wrapPending] = usePendingPromise();

    const tripDate = useMemo(() => getNextDateForDayKind(day), [day]);
    const desiredArrivalMs = useMemo(() => {
        if (typeof time !== "number") {
            return null;
        }
        const date = new Date(tripDate);
        const hours = Math.floor(time / HOUR);
        const minutes = Math.floor((time % HOUR) / MINUTE);
        date.setHours(hours, minutes, 0, 0);
        return date.getTime();
    }, [time, tripDate]);

    useEffect(() => {
        setError(null);
        setResults({});
        if (
            Number.isFinite(fromLat) &&
            Number.isFinite(fromLon) &&
            Number.isFinite(toLat) &&
            Number.isFinite(toLon) &&
            typeof time === "number"
        ) {
            const payload = {
                fromLat: fromLat!.toString(),
                fromLon: fromLon!.toString(),
                toLat: toLat!.toString(),
                toLon: toLon!.toString(),
                date: formatOtpDate(tripDate),
                time: formatOtpTime(time),
                arriveBy: navigationKind === "arrive-by" ? "true" : "false",
            };
            wrapPending(
                Promise.all(
                    scenarios.map(async (scenario) => {
                        const urlParams = new URLSearchParams({
                            ...payload,
                            router: scenario.router,
                        });
                        const res = await fetch(`/api/otpPlan?${urlParams.toString()}`);
                        const data = await res.json();
                        const otpError =
                            (typeof data?.error === "string" ? data.error : null) ||
                            data?.error?.message ||
                            data?.error?.msg ||
                            data?.error?.detail ||
                            null;
                        const itineraries = data?.plan?.itineraries || [];
                        const nextItinerary =
                            selectBestItinerary(itineraries, navigationKind, desiredArrivalMs) || null;
                        if (!nextItinerary) {
                            return [
                                scenario.id,
                                {
                                    itinerary: null,
                                    segments: [],
                                    error: otpError || "No route found.",
                                },
                            ] as const;
                        }
                        return [
                            scenario.id,
                            {
                                itinerary: nextItinerary,
                                segments: mapOtpItinerary(nextItinerary),
                                error: null,
                            },
                        ] as const;
                    })
                )
                    .then((entries) => {
                        setResults(Object.fromEntries(entries));
                    })
                    .catch(() => setError("Failed to load route."))
            );
        }
    }, [fromLat, fromLon, toLat, toLon, time, tripDate, navigationKind, wrapPending]);

    const summaryFor = (key: string) => {
        const result = results[key];
        if (!result?.itinerary || result.segments.length === 0) {
            return null;
        }
        const totalDuration = stringifyDuration(result.itinerary.duration, true);
        const startTime = stringifyTime(result.segments[0].startTime);
        const endTime = stringifyTime(result.segments[result.segments.length - 1].endTime);
        return { totalDuration, startTime, endTime };
    };

    const baselineSummary = summaryFor(scenarios[0].id);
    const enhancedSummary = summaryFor(scenarios[1].id);

    return (
        <AppFrame
            mode="journey"
            containerClassName={styles.explorer}
            controlsClassName={styles.controlsOverflowVisible}
            controls={
                <AddressJourneyPicker
                    disabled={isPending}
                    navigationKind={navigationKind}
                    time={time}
                    timeRange={[0, 24 * HOUR]}
                    day={day}
                    fromAddress={fromAddress}
                    toAddress={toAddress}
                    onSelectDay={(day) => updateJourneyParams({ day })}
                    onSelectTimeOfDay={(timeOfDay) => {
                        const defaultTime = timeOfDay === "evening" ? 18 * HOUR : 9 * HOUR;
                        updateJourneyParams({ time: defaultTime });
                    }}
                    onSelectNavigationKind={(kind) => updateJourneyParams({ navigationKind: kind })}
                    onSelectTime={(time) => updateJourneyParams({ time })}
                    onSwap={() =>
                        updateJourneyParams({
                            fromAddress: toAddress,
                            fromLat: toLat,
                            fromLon: toLon,
                            toAddress: fromAddress,
                            toLat: fromLat,
                            toLon: fromLon,
                        })
                    }
                    onChangeFromAddress={(value) =>
                        updateJourneyParams({ fromAddress: value, fromLat: null, fromLon: null })
                    }
                    onChangeToAddress={(value) =>
                        updateJourneyParams({ toAddress: value, toLat: null, toLon: null })
                    }
                    onSelectFromAddress={(selection: AddressSelection) =>
                        updateJourneyParams({
                            fromAddress: selection.label,
                            fromLat: selection.lat,
                            fromLon: selection.lon,
                        })
                    }
                    onSelectToAddress={(selection: AddressSelection) =>
                        updateJourneyParams({
                            toAddress: selection.label,
                            toLat: selection.lat,
                            toLon: selection.lon,
                        })
                    }
                />
            }
        >
            {isPending && (
                <div className={styles.error}>
                    <CgSpinner className="spinning" size={32} />
                </div>
            )}
            {error && <div className={styles.error}>{error}</div>}
            {Object.keys(results).length > 0 && (
                <div className={styles.comparison}>
                    <ComparisonRow
                        isHeader
                        baseline={
                            <div className="column-header">
                                <div className="header-blip baseline" />
                                {scenarios[0].name}
                            </div>
                        }
                        enhanced={
                            <div className="column-header">
                                <div className="header-blip enhanced" />
                                {scenarios[1].name}
                            </div>
                        }
                    />
                    <ComparisonRow
                        title="Total time"
                        baseline={
                            baselineSummary ? (
                                <>
                                    <div className="duration">{baselineSummary.totalDuration}</div>
                                    <div className="secondary">
                                        {baselineSummary.startTime}–{baselineSummary.endTime}
                                    </div>
                                </>
                            ) : (
                                results[scenarios[0].id]?.error || "No route found"
                            )
                        }
                        enhanced={
                            enhancedSummary ? (
                                <>
                                    <div className="duration">{enhancedSummary.totalDuration}</div>
                                    <div className="secondary">
                                        {enhancedSummary.startTime}–{enhancedSummary.endTime}
                                    </div>
                                </>
                            ) : (
                                results[scenarios[1].id]?.error || "No route found"
                            )
                        }
                    />
                    <ComparisonRow
                        title="Your trip"
                        baseline={
                            results[scenarios[0].id]?.segments?.length ? (
                                <JourneyTimeline segments={results[scenarios[0].id].segments} />
                            ) : (
                                results[scenarios[0].id]?.error || "No route found"
                            )
                        }
                        enhanced={
                            results[scenarios[1].id]?.segments?.length ? (
                                <JourneyTimeline segments={results[scenarios[1].id].segments} />
                            ) : (
                                results[scenarios[1].id]?.error || "No route found"
                            )
                        }
                    />
                </div>
            )}
        </AppFrame>
    );
};

export default OtpExplorer;
