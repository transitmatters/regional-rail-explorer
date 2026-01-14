import path from "path";

import { createGtfsLoader } from "server/network/load";

type StationLocation = {
    id: string;
    name: string;
    lat: number;
    lon: number;
};

let cachedStations: StationLocation[] | null = null;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const haversineMeters = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
    const earthRadiusMeters = 6371000;
    const dLat = toRadians(b.lat - a.lat);
    const dLon = toRadians(b.lon - a.lon);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const loadStationLocations = () => {
    if (cachedStations) {
        return cachedStations;
    }
    const archivePath = path.resolve(process.cwd(), "data", "gtfs-present.tar.gz");
    const loader = createGtfsLoader(archivePath);
    const stops = loader.stops() as Array<Record<string, string>>;
    const stations = stops
        .filter((stop) => stop.locationType === "1")
        .map((stop) => ({
            id: stop.stopId,
            name: stop.stopName,
            lat: parseFloat(stop.stopLat || ""),
            lon: parseFloat(stop.stopLon || ""),
        }))
        .filter((station) => Number.isFinite(station.lat) && Number.isFinite(station.lon));
    cachedStations = stations;
    return stations;
};

export default async (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        res.status(400).json({ error: "Missing or invalid lat/lon query params." });
        return;
    }
    const stations = loadStationLocations();
    let nearest: StationLocation | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    stations.forEach((station) => {
        const distance = haversineMeters({ lat, lon }, station);
        if (distance < closestDistance) {
            closestDistance = distance;
            nearest = station;
        }
    });
    if (!nearest) {
        res.status(404).json({ error: "No stations found." });
        return;
    }
    res.status(200).json({
        id: nearest.id,
        name: nearest.name,
        distanceMeters: Math.round(closestDistance),
    });
};
