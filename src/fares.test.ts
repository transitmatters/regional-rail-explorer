import { describe, expect, test } from "vitest";

import { JourneySegment, JourneyTravelSegment } from "types";
import { baseline, enhanced } from "storydata/journey";

import { calculateFare, getCommuterRailFare, isPeakSegment } from "./fares";

const HOUR = 60 * 60;

const zones = {
    "place-sstat": "1A",
    "place-north": "1A",
    "place-DB-2258": "1A",
    "place-ER-0168": "3",
    "place-WML-0442": "8",
    "place-WML-0214": "5",
    "place-FR-0201": "5",
    "place-FR-0494": "8",
    "place-NB-0137": "2",
};
const zoneForStation = (stationId: string) => zones[stationId] ?? null;

const ride = (
    from: string,
    to: string,
    routeId: string,
    startTime: number,
    directionId = "1"
): JourneyTravelSegment => ({
    kind: "travel",
    startTime,
    endTime: startTime + HOUR / 2,
    startStation: { id: from, name: from },
    endStation: { id: to, name: to },
    passedStations: [],
    routeId,
    routePatternId: routeId,
    directionId,
    levelBoarding: false,
});

const transfer: JourneySegment = {
    kind: "transfer",
    startTime: 0,
    endTime: 0,
    waitDuration: 0,
    walkDuration: 0,
};

describe("getCommuterRailFare", () => {
    test("charges the other station's zone when one end is in Zone 1A", () => {
        expect(getCommuterRailFare("1A", "8")).toBe(1225);
        expect(getCommuterRailFare("3", "1A")).toBe(800);
        expect(getCommuterRailFare("1A", "1A")).toBe(240);
    });

    test("charges an interzone fare counting every zone passed through", () => {
        // mbta.com's example: Concord (5) to Fitchburg (8) is Interzone 4
        expect(getCommuterRailFare("5", "8")).toBe(425);
        expect(getCommuterRailFare("4", "4")).toBe(275);
    });

    test("treats stations outside the zone system as downtown", () => {
        expect(getCommuterRailFare(null, "5")).toBe(975);
    });
});

describe("isPeakSegment", () => {
    test("is peak inbound 7-9am and outbound 4-7pm on weekdays", () => {
        const inbound = ride("place-WML-0442", "place-sstat", "CR-Worcester", 8 * HOUR, "1");
        const outbound = ride("place-sstat", "place-WML-0442", "CR-Worcester", 17 * HOUR, "0");
        expect(isPeakSegment(inbound, "weekday")).toBe(true);
        expect(isPeakSegment(outbound, "weekday")).toBe(true);
        expect(isPeakSegment(inbound, "saturday")).toBe(false);
    });

    test("is off-peak for reverse commutes and midday trips", () => {
        const reverse = ride("place-sstat", "place-WML-0442", "CR-Worcester", 8 * HOUR, "0");
        const midday = ride("place-WML-0442", "place-sstat", "CR-Worcester", 11 * HOUR, "1");
        expect(isPeakSegment(reverse, "weekday")).toBe(false);
        expect(isPeakSegment(midday, "weekday")).toBe(false);
    });
});

describe("calculateFare today", () => {
    const options = { unified: false, day: "weekday" as const };

    test("charges each Commuter Rail line and the subway separately", () => {
        // Salem -> North Station, Orange, Red, South Station -> Uphams Corner
        const fare = calculateFare(baseline, zoneForStation, options);
        expect(fare.legs).toEqual([
            { kind: "commuterRail", amount: 800 },
            { kind: "subway", amount: 240 },
            { kind: "commuterRail", amount: 240 },
        ]);
        expect(fare.total).toBe(1280);
    });

    test("covers a change of trains on the same line with one ticket", () => {
        const segments = [
            ride("place-WML-0442", "place-WML-0214", "CR-Worcester", 8 * HOUR),
            transfer,
            ride("place-WML-0214", "place-sstat", "CR-Worcester", 9 * HOUR),
        ];
        const fare = calculateFare(segments, zoneForStation, options);
        expect(fare.legs).toEqual([{ kind: "commuterRail", amount: 1225 }]);
    });

    test("charges one fare for a subway-only trip", () => {
        const segments = [ride("place-dwnxg", "place-pktrm", "Red", 8 * HOUR)];
        expect(calculateFare(segments, zoneForStation, options).total).toBe(240);
    });
});

describe("calculateFare with unified Regional Rail fares", () => {
    test("charges one fare for a multi-line trip, full price at peak", () => {
        const peak = enhanced.map((segment) => ({ ...segment, startTime: 8 * HOUR }));
        const fare = calculateFare(peak, zoneForStation, { unified: true, day: "weekday" });
        expect(fare).toEqual({
            total: 800,
            legs: [{ kind: "commuterRail", amount: 800 }],
            offPeakDiscount: false,
        });
    });

    test("halves the fare off-peak and on weekends", () => {
        const midday = enhanced.map((segment) => ({ ...segment, startTime: 11 * HOUR }));
        expect(calculateFare(midday, zoneForStation, { unified: true, day: "weekday" })).toEqual({
            total: 400,
            legs: [{ kind: "commuterRail", amount: 400 }],
            offPeakDiscount: true,
        });
        const peak = enhanced.map((segment) => ({ ...segment, startTime: 8 * HOUR }));
        expect(calculateFare(peak, zoneForStation, { unified: true, day: "sunday" }).total).toBe(
            400
        );
    });

    test("rounds half fares down to the quarter", () => {
        const midday = [ride("place-WML-0442", "place-sstat", "CR-Worcester", 11 * HOUR)];
        const fare = calculateFare(midday, zoneForStation, { unified: true, day: "weekday" });
        expect(fare.total).toBe(600);
    });

    test("prices a change of trains by the whole distance", () => {
        const segments = [
            ride("place-WML-0442", "place-WML-0214", "CR-Worcester", 8 * HOUR),
            transfer,
            ride("place-WML-0214", "place-sstat", "CR-Worcester", 9 * HOUR),
        ];
        const fare = calculateFare(segments, zoneForStation, { unified: true, day: "weekday" });
        expect(fare.total).toBe(1225);
    });

    test("still pays for the distance on each side of downtown", () => {
        // Salem (3) -> North Station, subway, South Station -> Needham Heights (2)
        const segments = [
            ride("place-ER-0168", "place-north", "CR-Newburyport", 11 * HOUR, "1"),
            ride("place-north", "place-sstat", "Orange", 11.5 * HOUR, "0"),
            ride("place-sstat", "place-NB-0137", "CR-Needham", 12 * HOUR, "0"),
        ];
        const fare = calculateFare(segments, zoneForStation, { unified: true, day: "weekday" });
        expect(fare.total).toBe(400);
    });
});
