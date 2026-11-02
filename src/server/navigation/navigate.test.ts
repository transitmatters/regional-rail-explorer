import path from "path";
import { beforeAll, describe, expect, test } from "vitest";

import { JourneyTravelSegment, NavigationKind, Network } from "types";
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
