import { HOUR } from "time";
import { isRegionalRailRouteId } from "routes";
import { FareLeg, JourneyFare, JourneySegment, JourneyTravelSegment, NetworkDayKind } from "types";

// Prices are in cents, from mbta.com/fares (checked November 2026).
const ZONE_FARES: Record<string, number> = {
    "1A": 240,
    "1": 650,
    "2": 700,
    "3": 800,
    "4": 875,
    "5": 975,
    "6": 1050,
    "7": 1100,
    "8": 1225,
    "9": 1275,
    "10": 1325,
};

// Indexed by the number of zones passed through, counting the origin and destination
const INTERZONE_FARES = [0, 275, 325, 350, 425, 475, 525, 575, 625, 675, 725];

export const SUBWAY_FARE = 240;

// The off-peak and reverse-commute discount proposed in "Harnessing the Full Potential of Regional
// Rail with Variable Pricing and Equitable Fare Policies" (MassINC & TransitMatters, Dec 2025).
// Peak trains travel toward Boston 7-9am or away from Boston 4-7pm on weekdays; every other
// trip, including the reverse commute, is half price.
const OFF_PEAK_DISCOUNT = 0.5;
const INBOUND_DIRECTION_ID = "1";
const INBOUND_PEAK = [7 * HOUR, 9 * HOUR];
const OUTBOUND_PEAK = [16 * HOUR, 19 * HOUR];

type ZoneForStation = (stationId: string) => null | undefined | string;

// Stations outside the zone system (e.g. subway stations where a Regional Rail trip might begin
// in a future network) are treated as downtown
const normalizeZone = (zone: null | undefined | string) => zone ?? "1A";

export const getCommuterRailFare = (
    fromZone: null | undefined | string,
    toZone: null | undefined | string
): number => {
    const from = normalizeZone(fromZone);
    const to = normalizeZone(toZone);
    if (from === "1A") {
        return ZONE_FARES[to];
    }
    if (to === "1A") {
        return ZONE_FARES[from];
    }
    const zonesPassedThrough = Math.abs(parseInt(from) - parseInt(to)) + 1;
    return INTERZONE_FARES[Math.min(zonesPassedThrough, INTERZONE_FARES.length - 1)];
};

const isCommuterRailSegment = (segment: JourneyTravelSegment) =>
    isRegionalRailRouteId(segment.routeId);

export const isPeakSegment = (segment: JourneyTravelSegment, day: NetworkDayKind) => {
    if (day !== "weekday") {
        return false;
    }
    const isInbound = segment.directionId === INBOUND_DIRECTION_ID;
    const [start, end] = isInbound ? INBOUND_PEAK : OUTBOUND_PEAK;
    return segment.startTime >= start && segment.startTime < end;
};

// Today, riders pay separately for each Commuter Rail line and for the subway. Changing trains
// within one Commuter Rail line is covered by the same ticket, and subway rides in a row are one
// fare thanks to free transfers.
const getSeparateFares = (
    travelSegments: JourneyTravelSegment[],
    zoneForStation: ZoneForStation
): FareLeg[] => {
    const legs: (FareLeg & { routeId: string; fromStationId: string })[] = [];
    travelSegments.forEach((segment) => {
        const previous = legs[legs.length - 1];
        if (isCommuterRailSegment(segment)) {
            const fromStationId =
                previous?.kind === "commuterRail" && previous.routeId === segment.routeId
                    ? legs.pop()!.fromStationId
                    : segment.startStation.id;
            legs.push({
                kind: "commuterRail",
                routeId: segment.routeId,
                fromStationId,
                amount: getCommuterRailFare(
                    zoneForStation(fromStationId),
                    zoneForStation(segment.endStation.id)
                ),
            });
        } else if (previous?.kind !== "subway") {
            legs.push({
                kind: "subway",
                routeId: segment.routeId,
                fromStationId: segment.startStation.id,
                amount: SUBWAY_FARE,
            });
        }
    });
    return legs.map(({ kind, amount }) => ({ kind, amount }));
};

export const calculateFare = (
    segments: JourneySegment[],
    zoneForStation: ZoneForStation,
    options: { unified: boolean; day: NetworkDayKind }
): JourneyFare => {
    const { unified, day } = options;
    const travelSegments = segments.filter(
        (segment): segment is JourneyTravelSegment => segment.kind === "travel"
    );
    if (!unified) {
        const legs = getSeparateFares(travelSegments, zoneForStation);
        return {
            total: legs.reduce((sum, leg) => sum + leg.amount, 0),
            legs,
            offPeakDiscount: false,
        };
    }
    // With unified fares, a trip is one fare however many trains it takes, with free transfers to
    // the subway. It costs the most expensive of the end-to-end Regional Rail fare and the fare of
    // any one train ridden, so a trip through downtown (e.g. Salem to Needham) still pays for the
    // distance to and from Boston.
    const commuterRailSegments = travelSegments.filter(isCommuterRailSegment);
    if (commuterRailSegments.length === 0) {
        const legs: FareLeg[] = [{ kind: "subway", amount: SUBWAY_FARE }];
        return { total: SUBWAY_FARE, legs, offPeakDiscount: false };
    }
    const first = commuterRailSegments[0];
    const last = commuterRailSegments[commuterRailSegments.length - 1];
    const fullFare = Math.max(
        ...[[first, last], ...commuterRailSegments.map((segment) => [segment, segment])].map(
            ([from, to]) =>
                getCommuterRailFare(
                    zoneForStation(from.startStation.id),
                    zoneForStation(to.endStation.id)
                )
        )
    );
    const offPeakDiscount = !commuterRailSegments.some((segment) => isPeakSegment(segment, day));
    // Rounded down to the quarter, as the MBTA does for its half-price reduced fares
    const total = offPeakDiscount ? Math.floor((fullFare * OFF_PEAK_DISCOUNT) / 25) * 25 : fullFare;
    return { total, legs: [{ kind: "commuterRail", amount: total }], offPeakDiscount };
};

export const formatFare = (cents: number) => `$${(cents / 100).toFixed(2)}`;
