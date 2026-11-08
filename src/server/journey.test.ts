import { describe, expect, test } from "vitest";

import { JourneyInfo, JourneyTravelSegment } from "types";

import { getSuccessfulJourneys } from "./journey";

// Reads scenarios.json, which `npm run build` writes

// Today's journey used to walk from Lansdowne to Kenmore before boarding, while the Regional Rail
// one boarded at Lansdowne, and the comparison page crashed looking up arrivals at Kenmore. Journeys
// now always start at the rider's station.
describe("journeys from a station near another one", () => {
    const journeys = getSuccessfulJourneys({
        fromStationId: "place-WML-0025",
        toStationId: "place-ogmnl",
        day: "saturday",
        time: 21 * 60 * 60,
        navigationKind: "depart-at",
    }) as JourneyInfo[];

    test("key arrivals and crowding by the station where the first train is boarded", () => {
        expect(journeys).not.toBeNull();
        journeys.forEach((journey) => {
            const firstTravel = journey.segments.find(
                (seg): seg is JourneyTravelSegment => seg.kind === "travel"
            )!;
            expect(firstTravel.startStation.id).toBe("place-WML-0025");
            expect(Object.keys(journey.arrivals)).toEqual([firstTravel.startStation.id]);
            expect(journey.arrivals[firstTravel.startStation.id].times).toContain(
                firstTravel.startTime
            );
            Object.keys(journey.platformCrowding).forEach((stationId) =>
                expect(stationId).toBe(firstTravel.startStation.id)
            );
        });
    });
});
