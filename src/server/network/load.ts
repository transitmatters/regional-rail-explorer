import parse from "csv-parse/lib/sync";
import fs from "fs";
import path from "path";
import { camelize } from "@ridi/object-case-converter";

import {
    GtfsService,
    GtfsRoute,
    GtfsTrip,
    GtfsStop,
    GtfsStopTime,
    GtfsTransfer,
    GtfsRoutePatternAmenities,
} from "types";

const loadCsv = <T>(filePath: string): T[] => {
    const contents = fs.readFileSync(filePath);
    const records = parse(contents, { delimiter: ",", columns: true });
    return records.map(camelize);
};

export type GtfsLoader = ReturnType<typeof createGtfsLoader>;

export const createGtfsLoader = (basePath: string) => {
    const reader = <T>(filename) => () => loadCsv<T>(path.join(basePath, filename + ".txt"));

    const optionalReader = <T>(filename) => {
        if (fs.existsSync(filename)) {
            return reader<T>(filename);
        }
        return null;
    };

    return {
        basePath,
        routes: reader<GtfsRoute>("routes"),
        trips: reader<GtfsTrip>("trips"),
        stops: reader<GtfsStop>("stops"),
        services: reader<GtfsService>("calendar"),
        stopTimes: reader<GtfsStopTime>("stop_times"),
        relevantStopTimes: reader<GtfsStopTime>("relevant_stop_times"),
        transfers: reader<GtfsTransfer>("transfers"),
        amenities: optionalReader<GtfsRoutePatternAmenities>("amenities"),
    };
};
