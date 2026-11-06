import { JourneySegment } from "types";

export const baseline: JourneySegment[] = [
    { kind: "transfer", startTime: 26100, waitDuration: 1080, walkDuration: 0, endTime: 27180 },
    {
        kind: "travel",
        startTime: 27180,
        endTime: 29280,
        levelBoarding: false,
        startStation: { name: "Salem", id: "place-ER-0168" },
        endStation: { name: "North Station", id: "place-north" },
        passedStations: [
            { time: 27660, station: { name: "Swampscott", id: "place-ER-0128" } },
            { time: 27900, station: { name: "Lynn", id: "place-ER-0115" } },
            { time: 28080, station: { name: "River Works", id: "place-ER-0099" } },
            { time: 28500, station: { name: "Chelsea", id: "place-ER-0046" } },
        ],
        routeId: "CR-Newburyport",
        routePatternId: "Newburyport",
    },
    { kind: "transfer", startTime: 29280, walkDuration: 302, waitDuration: 298, endTime: 29880 },
    {
        kind: "travel",
        levelBoarding: true,
        startTime: 29880,
        endTime: 30240,
        startStation: { name: "North Station", id: "place-north" },
        endStation: { name: "Downtown Crossing", id: "place-dwnxg" },
        passedStations: [
            { time: 30000, station: { name: "Haymarket", id: "place-haecl" } },
            { time: 30120, station: { name: "State", id: "place-state" } },
        ],
        routeId: "Orange",
        routePatternId: "Orange",
    },
    { kind: "transfer", startTime: 30240, walkDuration: 115, waitDuration: 5, endTime: 30360 },
    {
        kind: "travel",
        startTime: 30360,
        endTime: 30480,
        levelBoarding: true,
        startStation: { name: "Downtown Crossing", id: "place-dwnxg" },
        endStation: { name: "South Station", id: "place-sstat" },
        passedStations: [],
        routeId: "Red",
        routePatternId: "Red",
    },
    { kind: "transfer", startTime: 30480, walkDuration: 162, waitDuration: 558, endTime: 31200 },
    {
        kind: "travel",
        startTime: 31200,
        endTime: 31800,
        levelBoarding: false,
        startStation: { name: "South Station", id: "place-sstat" },
        endStation: { name: "Uphams Corner", id: "place-DB-2258" },
        passedStations: [{ time: 31680, station: { name: "Newmarket", id: "place-DB-2265" } }],
        routeId: "CR-Fairmount",
        routePatternId: "Fairmount",
    },
];

export const enhanced: JourneySegment[] = [
    { kind: "transfer", startTime: 26100, waitDuration: 500, walkDuration: 0, endTime: 31100 },
    {
        kind: "travel",
        startTime: 26600,
        endTime: 27900,
        levelBoarding: true,
        startStation: { name: "Salem", id: "place-ER-0168" },
        endStation: { name: "North Station", id: "place-north" },
        passedStations: [
            { time: 27660, station: { name: "Swampscott", id: "place-ER-0128" } },
            { time: 27900, station: { name: "Lynn", id: "place-ER-0115" } },
            { time: 28080, station: { name: "River Works", id: "place-ER-0099" } },
            { time: 28500, station: { name: "Chelsea", id: "place-ER-0046" } },
        ],
        routeId: "CR-Newburyport",
        routePatternId: "Newburyport",
    },
    { kind: "transfer", startTime: 29280, walkDuration: 302, waitDuration: 298, endTime: 29880 },
    {
        kind: "travel",
        startTime: 28420,
        endTime: 28780,
        levelBoarding: true,
        startStation: { name: "North Station", id: "place-north" },
        endStation: { name: "Downtown Crossing", id: "place-dwnxg" },
        passedStations: [
            { time: 30000, station: { name: "Haymarket", id: "place-haecl" } },
            { time: 30120, station: { name: "State", id: "place-state" } },
        ],
        routeId: "Orange",
        routePatternId: "Orange",
    },
    { kind: "transfer", startTime: 28780, walkDuration: 115, waitDuration: 5, endTime: 28900 },
    {
        kind: "travel",
        levelBoarding: true,
        startTime: 28900,
        endTime: 29020,
        startStation: { name: "Downtown Crossing", id: "place-dwnxg" },
        endStation: { name: "South Station", id: "place-sstat" },
        passedStations: [],
        routeId: "Red",
        routePatternId: "Red",
    },
    { kind: "transfer", startTime: 30480, walkDuration: 162, waitDuration: 450, endTime: 31092 },
    {
        kind: "travel",
        levelBoarding: true,
        startTime: 29632,
        endTime: 30052,
        startStation: { name: "South Station", id: "place-sstat" },
        endStation: { name: "Uphams Corner", id: "place-DB-2258" },
        passedStations: [{ time: 31300, station: { name: "Newmarket", id: "place-DB-2265" } }],
        routeId: "CR-Fairmount",
        routePatternId: "Fairmout",
    },
];

// West Newton to Longwood on today's Commuter Rail, walking from Lansdowne to Fenway
export const walkBetweenStations: JourneySegment[] = [
    {
        kind: "transfer",
        startTime: 28800,
        endTime: 31500,
        waitDuration: 2700,
        walkDuration: 0,
    },
    {
        kind: "travel",
        levelBoarding: false,
        startTime: 31500,
        endTime: 32340,
        startStation: {
            name: "West Newton",
            id: "place-WML-0091",
        },
        endStation: {
            name: "Lansdowne",
            id: "place-WML-0025",
        },
        passedStations: [
            {
                time: 31740,
                station: {
                    name: "Newtonville",
                    id: "place-WML-0081",
                },
            },
            {
                time: 32040,
                station: {
                    name: "Boston Landing",
                    id: "place-WML-0035",
                },
            },
        ],
        routeId: "CR-Worcester",
        routePatternId: "CR-Worcester-6874ed14-1",
    },
    {
        kind: "transfer",
        startTime: 32340,
        endTime: 32940,
        waitDuration: 0,
        walkDuration: 600,
        walkFromStation: {
            name: "Lansdowne",
            id: "place-WML-0025",
        },
        walkToStation: {
            name: "Fenway",
            id: "place-fenwy",
        },
    },
    {
        kind: "travel",
        levelBoarding: true,
        startTime: 32940,
        endTime: 33060,
        startStation: {
            name: "Fenway",
            id: "place-fenwy",
        },
        endStation: {
            name: "Longwood",
            id: "place-longw",
        },
        passedStations: [],
        routeId: "Green-D",
        routePatternId: "Green-D-854-0",
    },
];

// Copley to West Newton on today's Commuter Rail, starting with a walk to Back Bay
export const walkFromOrigin: JourneySegment[] = [
    {
        kind: "transfer",
        startTime: 63000,
        endTime: 64320,
        waitDuration: 960,
        walkDuration: 360,
        walkFromStation: {
            name: "Copley",
            id: "place-coecl",
        },
        walkToStation: {
            name: "Back Bay",
            id: "place-bbsta",
        },
    },
    {
        kind: "travel",
        levelBoarding: false,
        startTime: 64320,
        endTime: 65520,
        startStation: {
            name: "Back Bay",
            id: "place-bbsta",
        },
        endStation: {
            name: "West Newton",
            id: "place-WML-0091",
        },
        passedStations: [
            {
                time: 64560,
                station: {
                    name: "Lansdowne",
                    id: "place-WML-0025",
                },
            },
            {
                time: 64920,
                station: {
                    name: "Boston Landing",
                    id: "place-WML-0035",
                },
            },
            {
                time: 65280,
                station: {
                    name: "Newtonville",
                    id: "place-WML-0081",
                },
            },
        ],
        routeId: "CR-Worcester",
        routePatternId: "CR-Worcester-b7d67732-0",
    },
];
