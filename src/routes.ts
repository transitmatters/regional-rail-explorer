export const getColorForRouteId = (routeId: string) => {
    if (routeId.startsWith("Green-")) {
        return "green";
    } else if (routeId.startsWith("7")) {
        return "silver";
    } else if (isRegionalRailRouteId(routeId)) {
        return "regional-rail";
    }
    return routeId.toLowerCase();
};

export const isRegionalRailRouteId = (routeId: string) =>
    routeId.startsWith("CR-") || routeId.startsWith("RR-");

export const isSilverLineRouteId = (routeId: string) =>
    routeId.length === 3 && routeId.startsWith("7");

export const textColor = (line: string) => {
    return "text-" + line.toLowerCase();
};

export const bkgColor = (line: string) => {
    return "bkg-" + line.toLowerCase();
};
