export const modes = {
    journey: {
        id: "journey",
        label: "Trip planner",
        href: "/",
    },
    routes: {
        id: "routes",
        label: "Routes",
        href: "/routes",
    },
    stations: {
        id: "stations",
        label: "Stations",
        href: "/stations",
    },
} as const;

export type Mode = keyof typeof modes;
