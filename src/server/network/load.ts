import fs from "fs";
import path from "path";
import tmp from "tmp";
import { extract } from "tar";
import { parse } from "csv-parse/sync";
import { camelize } from "@ridi/object-case-converter";

import {
    GtfsService,
    GtfsRoute,
    GtfsRoutePattern,
    GtfsTrip,
    GtfsStop,
    GtfsStopTime,
    GtfsTransfer,
    GtfsRoutePatternAmenities,
} from "types";

const uncompressArchiveToTmpDirectory = (archivePath: string) => {
    const { name: tmpDir } = tmp.dirSync();
    const [archivePrettyName] = path.basename(archivePath).split(".");
    extract({ file: archivePath, sync: true, cwd: tmpDir });
    return path.join(tmpDir, archivePrettyName);
};

const loadCsv = <T>(filePath: string): T[] => {
    const contents = fs.readFileSync(filePath);
    const records: Record<string, string>[] = parse(contents, { delimiter: ",", columns: true });
    return records.map((record) => camelize<T>(record));
};

export const createGtfsLoader = (archivePath: string) => {
    const basePath = uncompressArchiveToTmpDirectory(archivePath);

    const resolvePath = (filename: string) => path.join(basePath, filename + ".txt");
    const reader =
        <T>(filename: string) =>
        () =>
            loadCsv<T>(resolvePath(filename));

    const optionalReader = <T>(filename: string) => {
        if (fs.existsSync(resolvePath(filename))) {
            return reader<T>(filename);
        }
        return null;
    };

    return {
        basePath,
        routes: reader<GtfsRoute>("routes"),
        routePatterns: reader<GtfsRoutePattern>("route_patterns"),
        trips: reader<GtfsTrip>("trips"),
        stops: reader<GtfsStop>("stops"),
        services: reader<GtfsService>("calendar"),
        stopTimes: reader<GtfsStopTime>("stop_times"),
        relevantStopTimes: reader<GtfsStopTime>("relevant_stop_times"),
        transfers: reader<GtfsTransfer>("transfers"),
        amenities: optionalReader<GtfsRoutePatternAmenities>("amenities"),
    };
};

export type GtfsLoader = ReturnType<typeof createGtfsLoader>;
