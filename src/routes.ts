const routeColors = {
    Red: "#da291c",
    Blue: "#003da5",
    Orange: "#ed8b00",
    Green: "#00843d",
    Silver: "#7c878e",
};

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

export const getColorCodeForRouteId = (routeId: string) => {
    if (routeId.startsWith("CR-")) {
        return "#80276c";
    }
    if (routeId.startsWith("Green-")) {
        return routeColors.Green;
    }
    if (routeId.startsWith("7")) {
        return routeColors.Silver;
    }
    return routeColors[routeId];
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
