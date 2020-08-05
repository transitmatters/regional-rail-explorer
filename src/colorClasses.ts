export const getColorForRouteId = (routeId) => {
    if (routeId.startsWith("Green-")) {
        return "green";
    } else if (routeId.startsWith("7")) {
        return "silver";
    } else if (routeId.startsWith("CR-")) {
        return "regional-rail";
    }
    return routeId.toLowerCase();
};

export const textColor = (line) => {
    return "text-" + line.toLowerCase();
};

export const bkgColor = (line) => {
    return "bkg-" + line.toLowerCase();
};
