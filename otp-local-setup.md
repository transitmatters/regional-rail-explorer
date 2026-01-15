NOTE: everything is vibe-coded

# Local OTP Setup (Present + Regional Routers)

These instructions are for running the Regional Rail Explorer OTP flow locally with two routers
("present" and "regional"). Right now we use the same MBTA GTFS feed for both routers, but you can
swap in any GTFS zip per router later.

## Prereqs

- Java 17 (Temurin recommended)
- Node 22.x + npm 10.x
- OpenTripPlanner 2.8.1 jar:
  https://github.com/opentripplanner/OpenTripPlanner/releases/download/v2.8.1/otp-shaded-2.8.1.jar

## Data downloads

Download these to a working folder (example: `~/otp-data/raw`):

- MBTA GTFS: https://cdn.mbta.com/MBTA_GTFS.zip
- OSM extract (Massachusetts): https://download.geofabrik.de/north-america/us/massachusetts-latest.osm.pbf

## Build OTP graphs

Create a router directory structure (names become router IDs):

```bash
mkdir -p ~/otp-data/routers/present
mkdir -p ~/otp-data/routers/regional
```

Copy GTFS and OSM into each router folder. For now, both routers use the same MBTA feed:

```bash
cp ~/otp-data/raw/MBTA_GTFS.zip ~/otp-data/routers/present/gtfs.zip
cp ~/otp-data/raw/MBTA_GTFS.zip ~/otp-data/routers/regional/gtfs.zip
cp ~/otp-data/raw/massachusetts-latest.osm.pbf ~/otp-data/routers/present/
cp ~/otp-data/raw/massachusetts-latest.osm.pbf ~/otp-data/routers/regional/
```

Build graphs (repeat per router). Adjust `-Xmx` based on your RAM (I failed on 2G, succeeded on 8G)

```bash
java -Xmx8G -jar ~/otp-data/otp-shaded-2.8.1.jar --build ~/otp-data/routers/present --save
java -Xmx8G -jar ~/otp-data/otp-shaded-2.8.1.jar --build ~/otp-data/routers/regional --save
```

You should see `graph.obj` created under each router folder.

## Run OTP locally (two servers)

OTP 2.8 loads one graph per server process, so run two servers on different ports:

```bash
java -Xmx8G -jar ~/otp-data/otp-shaded-2.8.1.jar --load ~/otp-data/routers/present --port 8080 --serve
java -Xmx8G -jar ~/otp-data/otp-shaded-2.8.1.jar --load ~/otp-data/routers/regional --port 8081 --serve
```

Verify each server is running:

```bash
curl http://localhost:8080/otp/routers
curl http://localhost:8081/otp/routers
```

## Configure Regional Rail Explorer

Create `regional-rail-explorer/.env.local` with:

```bash
OTP_BASE_URL_PRESENT=http://localhost:8080/otp
OTP_BASE_URL_REGIONAL=http://localhost:8081/otp
```

Run the app:

```bash
cd /Users/srihariganesh/Documents/transitmatters/regional-rail-explorer
npm install
npm run dev
```

Then open http://localhost:3000/explore-otp and try a trip. Each scenario now queries a different
OTP server. The API uses the router-scoped GraphQL endpoint
(`/otp/routers/<router>/index/graphql`), so the base URL must end at `/otp`.

## Swapping in different GTFS feeds

If you later generate a different GTFS zip for the regional rail router, replace
`~/otp-data/routers/regional/gtfs.zip` with that file and rebuild only that router.
