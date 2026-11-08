import { describe, expect, test } from "vitest";

import { JourneyInfo, JourneyTravelSegment } from "types";

import { getSuccessfulJourneys } from "./journey";

// Reads scenarios.json, which `npm run build` writes

// Today's journey walks from Lansdowne to Kenmore before boarding, while the Regional Rail one
// boards at Lansdowne. The comparison page crashed looking up arrivals at Kenmore when they were
// keyed by Lansdowne.
describe("journeys that start by walking to another station", () => {
    const journeys = getSuccessfulJourneys({
        fromStationId: "place-WML-0025",
        toStationId: "place-ogmnl",
        day: "saturday",
        time: 21 * 60 * 60,
        navigationKind: "depart-at",
    }) as JourneyInfo[];

    test("key arrivals and crowding by the station where the first train is boarded", () => {
        expect(journeys).not.toBeNull();
        const [present, regionalRail] = journeys;
        expect(present.segments[0]).toMatchObject({
            kind: "transfer",
            walkFromStation: { id: "place-WML-0025" },
            walkToStation: { id: "place-kencl" },
        });
        journeys.forEach((journey) => {
            const firstTravel = journey.segments.find(
                (seg): seg is JourneyTravelSegment => seg.kind === "travel"
            )!;
            expect(Object.keys(journey.arrivals)).toEqual([firstTravel.startStation.id]);
            expect(journey.arrivals[firstTravel.startStation.id].times).toContain(
                firstTravel.startTime
            );
            Object.keys(journey.platformCrowding).forEach((stationId) =>
                expect(stationId).toBe(firstTravel.startStation.id)
            );
        });
        expect(regionalRail.arrivals["place-WML-0025"]).toBeDefined();
        expect(present.arrivals["place-kencl"]).toBeDefined();
    });
});
