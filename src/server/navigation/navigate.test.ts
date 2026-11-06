import path from "path";
import { beforeAll, describe, expect, test } from "vitest";

import { JourneyTransferSegment, JourneyTravelSegment, NavigationKind, Network } from "types";
import { loadGtfsNetwork } from "server/network";

import { navigate } from ".";

const HOUR = 60 * 60;

let present: Network;

beforeAll(() => {
    present = loadGtfsNetwork(path.resolve(process.cwd(), "data", "gtfs-present.tar.gz"));
});

const navigatePresent = (
    fromStationId: string,
    toStationId: string,
    time: number,
    navigationKind: NavigationKind
) =>
    navigate({
        fromStation: present.stationsById[fromStationId],
        toStation: present.stationsById[toStationId],
        initialDayTime: { day: "weekday", time },
        navigationKind,
        unifiedFares: false,
    });

const travelSegments = (journey: ReturnType<typeof navigate>) =>
    journey.filter((segment): segment is JourneyTravelSegment => segment.kind === "travel");

const duration = (journey: ReturnType<typeof navigate>) =>
    journey[journey.length - 1].endTime - journey[0].startTime;

// Most New Bedford trains are a South Station - Fall River train plus a shuttle from East
// Taunton to New Bedford, so riders change at East Taunton (issue #163)
describe("changing trains at East Taunton", () => {
    test("Gilman Square to New Bedford, departing at 8:06 AM", () => {
        const journey = navigatePresent("place-gilmn", "place-NBM-0546", 29160, "depart-at");
        const endStationIds = travelSegments(journey).map((segment) => segment.endStation.id);
        expect(endStationIds).toContain("place-NBM-0374");
        expect(endStationIds[endStationIds.length - 1]).toBe("place-NBM-0546");
        // The 8:18 from South Station can't be reached, so the next is the 9:35, arriving 11:23.
        // Without the East Taunton change, the first train to reach New Bedford is mid-afternoon.
        expect(journey[journey.length - 1].endTime).toBeLessThanOrEqual(11.5 * HOUR);
    });

    test("Gilman Square to New Bedford, arriving by 11 AM", () => {
        const journey = navigatePresent("place-gilmn", "place-NBM-0546", 11 * HOUR, "arrive-by");
        const travel = travelSegments(journey);
        expect(travel[travel.length - 1].endStation.id).toBe("place-NBM-0546");
        expect(travel[travel.length - 1].endTime).toBeGreaterThan(9 * HOUR);
        expect(travel[travel.length - 1].endTime - travel[0].startTime).toBeLessThan(3 * HOUR);
    });

    test("New Bedford to South Station, departing at 7 AM", () => {
        const journey = navigatePresent("place-NBM-0546", "place-sstat", 7 * HOUR, "depart-at");
        const travel = travelSegments(journey);
        expect(travel[travel.length - 1].endStation.id).toBe("place-sstat");
        expect(duration(journey)).toBeLessThan(3 * HOUR);
    });
});

const walkSegments = (journey: ReturnType<typeof navigate>) =>
    journey.filter(
        (segment): segment is JourneyTransferSegment =>
            segment.kind === "transfer" && !!segment.walkToStation
    );

// Riders can leave one station and walk to a nearby one, like Lansdowne to Kenmore (issue #58)
describe("walking between stations", () => {
    test("West Newton to Longwood walks from Lansdowne to the D branch", () => {
        const journey = navigatePresent("place-WML-0091", "place-longw", 8 * HOUR, "depart-at");
        const travel = travelSegments(journey);
        expect(travel.map((segment) => segment.routeId)).toEqual(["CR-Worcester", "Green-D"]);
        expect(travel[0].endStation.id).toBe("place-WML-0025");
        const [walk] = walkSegments(journey);
        expect(walk.walkFromStation?.id).toBe("place-WML-0025");
        expect(walk.walkToStation?.id).toBe(travel[1].startStation.id);
        expect(walk.walkDuration).toBeGreaterThan(0);
    });

    test("West Newton to Copley ends with a walk from Back Bay", () => {
        const journey = navigatePresent("place-WML-0091", "place-coecl", 8 * HOUR, "depart-at");
        const lastSegment = journey[journey.length - 1] as JourneyTransferSegment;
        expect(lastSegment.walkFromStation?.id).toBe("place-bbsta");
        expect(lastSegment.walkToStation?.id).toBe("place-coecl");
        expect(lastSegment.waitDuration).toBe(0);
        expect(travelSegments(journey)).toHaveLength(1);
    });

    test("Copley to Wellesley Hills starts with a walk to Back Bay", () => {
        const journey = navigatePresent("place-coecl", "place-WML-0135", 17 * HOUR, "depart-at");
        const [firstSegment] = journey as JourneyTransferSegment[];
        expect(firstSegment.walkFromStation?.id).toBe("place-coecl");
        expect(firstSegment.walkToStation?.id).toBe("place-bbsta");
        expect(firstSegment.startTime).toBe(17 * HOUR);
        expect(travelSegments(journey).map((segment) => segment.startStation.id)).toEqual([
            "place-bbsta",
        ]);
    });

    test("Copley to Wellesley Hills, departing after 5 PM, keeps the walk but not the wait", () => {
        const journey = navigatePresent("place-coecl", "place-WML-0135", 17 * HOUR, "depart-after");
        const [firstSegment, secondSegment] = journey;
        expect(firstSegment.kind).toBe("transfer");
        expect((firstSegment as JourneyTransferSegment).walkToStation?.id).toBe("place-bbsta");
        expect((firstSegment as JourneyTransferSegment).waitDuration).toBe(0);
        expect(firstSegment.endTime).toBe(secondSegment.startTime);
    });

    test("West Newton to Longwood, arriving by 10 AM, walks from Lansdowne", () => {
        const journey = navigatePresent("place-WML-0091", "place-longw", 10 * HOUR, "arrive-by");
        const travel = travelSegments(journey);
        expect(travel[0].endStation.id).toBe("place-WML-0025");
        expect(travel[travel.length - 1].endStation.id).toBe("place-longw");
        expect(walkSegments(journey)).toHaveLength(1);
        expect(journey[journey.length - 1].endTime).toBeLessThanOrEqual(10 * HOUR);
    });
});
