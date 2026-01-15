const getOtpBaseUrl = (router: string) => {
    if (router === "present") {
        return process.env.OTP_BASE_URL_PRESENT;
    }
    if (router === "regional") {
        return process.env.OTP_BASE_URL_REGIONAL;
    }
    return null;
};

const buildOtpUrl = (base: string, query: Record<string, string>) => {
    const url = new URL(base);
    Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
};

const getCandidatePlanUrls = (router: string, query: Record<string, string>) => {
    const base = getOtpBaseUrl(router)!.replace(/\/$/, "");
    const candidates: string[] = [];

    if (base.endsWith("/plan")) {
        candidates.push(base);
    } else {
        candidates.push(`${base}/plan`);
        candidates.push(`${base}/${router}/plan`);
        candidates.push(`${base}/routers/${router}/plan`);
    }

    return candidates.map((candidate) => buildOtpUrl(candidate, query));
};

const getGraphqlEndpoint = (router: string) => {
    const base = getOtpBaseUrl(router)!.replace(/\/$/, "");
    if (base.endsWith("/graphql")) {
        return base;
    }
    if (base.endsWith("/index/graphql")) {
        return base;
    }
    if (base.endsWith("/otp")) {
        return `${base}/routers/${router}/index/graphql`;
    }
    if (base.endsWith("/otp/routers")) {
        return `${base}/${router}/index/graphql`;
    }
    return `${base}/routers/${router}/index/graphql`;
};

const mapGraphqlItineraries = (itineraries: any[]) =>
    itineraries.map((itinerary) => ({
        duration: itinerary.duration,
        startTime: itinerary.startTime,
        endTime: itinerary.endTime,
        legs: (itinerary.legs || []).map((leg) => ({
            mode: leg.mode,
            startTime: leg.startTime,
            endTime: leg.endTime,
            duration:
                typeof leg.duration === "number"
                    ? leg.duration
                    : typeof leg.startTime === "number" && typeof leg.endTime === "number"
                    ? Math.max(0, Math.round((leg.endTime - leg.startTime) / 1000))
                    : undefined,
            distance: leg.distance,
            routeId: leg.route?.id || undefined,
            route: leg.route?.shortName || leg.route?.longName || undefined,
            tripId: leg.trip?.id || undefined,
            from: { name: leg.from?.name, stopId: leg.from?.stop?.gtfsId },
            to: { name: leg.to?.name, stopId: leg.to?.stop?.gtfsId },
            intermediateStops: (leg.intermediateStops || []).map((stop) => ({
                name: stop.name,
                departureTime: stop.departureTime,
            })),
        })),
    }));

const buildGraphqlPlan = (query: Record<string, string>, includeTime: boolean) => {
    const timeArgs = includeTime ? "date: $date, time: $time, arriveBy: $arriveBy, " : "";
    const timeVars = includeTime
        ? {
              date: query.date,
              time: query.time,
              arriveBy: query.arriveBy === "true",
          }
        : {};
    const timeVarDefs = includeTime ? ", $date: String!, $time: String!, $arriveBy: Boolean!" : "";

    return {
        query: `
          query Plan($from: InputCoordinates!, $to: InputCoordinates!${timeVarDefs}, $numItineraries: Int) {
            plan(from: $from, to: $to, ${timeArgs}numItineraries: $numItineraries) {
              itineraries {
                duration
                startTime
                endTime
                legs {
                  mode
                  startTime
                  endTime
                  duration
                  distance
                  route {
                    id
                    shortName
                    longName
                  }
                  trip {
                    id
                  }
                  from { name stop { gtfsId } }
                  to { name stop { gtfsId } }
                  intermediateStops { name departureTime }
                }
              }
            }
          }
        `,
        variables: {
            from: { lat: Number(query.fromLat), lon: Number(query.fromLon) },
            to: { lat: Number(query.toLat), lon: Number(query.toLon) },
            numItineraries: 3,
            ...timeVars,
        },
    };
};

const buildGraphqlPlanTimeLite = (query: Record<string, string>) => ({
    query: `
      query Plan($from: InputCoordinates!, $to: InputCoordinates!, $date: String!, $time: String!, $arriveBy: Boolean!, $numItineraries: Int) {
        plan(from: $from, to: $to, date: $date, time: $time, arriveBy: $arriveBy, numItineraries: $numItineraries) {
          itineraries {
            duration
            startTime
            endTime
            legs {
              mode
              startTime
              endTime
              distance
              from { name }
              to { name }
            }
          }
        }
      }
    `,
    variables: {
        from: { lat: Number(query.fromLat), lon: Number(query.fromLon) },
        to: { lat: Number(query.toLat), lon: Number(query.toLon) },
        date: query.date,
        time: query.time,
        arriveBy: query.arriveBy === "true",
        numItineraries: 3,
    },
});

const buildGraphqlPlanLite = (query: Record<string, string>) => ({
    query: `
      query Plan($from: InputCoordinates!, $to: InputCoordinates!, $numItineraries: Int) {
        plan(from: $from, to: $to, numItineraries: $numItineraries) {
          itineraries {
            duration
            startTime
            endTime
            legs {
              mode
              startTime
              endTime
              distance
              from { name }
              to { name }
            }
          }
        }
      }
    `,
    variables: {
        from: { lat: Number(query.fromLat), lon: Number(query.fromLon) },
        to: { lat: Number(query.toLat), lon: Number(query.toLon) },
        numItineraries: 3,
    },
});

const requestGraphqlPlan = async (endpoint: string, payload: Record<string, unknown>) => {
    const graphqlRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const graphqlJson = await graphqlRes.json();
    return { ok: graphqlRes.ok, json: graphqlJson };
};

export default async (req, res) => {
    const { fromLat, fromLon, toLat, toLon, date, time, arriveBy, router } = req.query;
    if (!fromLat || !fromLon || !toLat || !toLon) {
        res.status(400).json({ error: "Missing required query params." });
        return;
    }
    if (!router) {
        res.status(400).json({ error: "Missing required router param." });
        return;
    }
    const hasTripTime = Boolean(date && time);
    const planQuery = hasTripTime
        ? {
              fromPlace: `${fromLat},${fromLon}`,
              toPlace: `${toLat},${toLon}`,
              date: date.toString(),
              time: time.toString(),
              arriveBy: arriveBy === "true" ? "true" : "false",
              mode: "WALK,TRANSIT",
          }
        : null;
    try {
        const routerId = router.toString();
        const baseUrl = getOtpBaseUrl(routerId);
        if (!baseUrl) {
            res.status(400).json({ error: "Unsupported router value." });
            return;
        }
        const graphqlEndpoint = getGraphqlEndpoint(routerId);
        const graphqlBaseVars = {
            fromLat: fromLat.toString(),
            fromLon: fromLon.toString(),
            toLat: toLat.toString(),
            toLon: toLon.toString(),
        };
        const graphqlPayload = hasTripTime
            ? buildGraphqlPlan(
                  {
                      ...graphqlBaseVars,
                      date: date.toString(),
                      time: time.toString(),
                      arriveBy: arriveBy === "true" ? "true" : "false",
                  },
                  true
              )
            : buildGraphqlPlanLite(graphqlBaseVars);

        const graphqlAttempt = await requestGraphqlPlan(graphqlEndpoint, graphqlPayload);
        if (graphqlAttempt.ok && graphqlAttempt.json?.data?.plan) {
            const itineraries = graphqlAttempt.json.data.plan.itineraries || [];
            res.status(200).json({ plan: { itineraries: mapGraphqlItineraries(itineraries) } });
            return;
        }
        if (graphqlAttempt.json?.errors?.length) {
            const fallbackPayload = hasTripTime
                ? buildGraphqlPlanTimeLite({
                      ...graphqlBaseVars,
                      date: date.toString(),
                      time: time.toString(),
                      arriveBy: arriveBy === "true" ? "true" : "false",
                  })
                : buildGraphqlPlanLite(graphqlBaseVars);
            const fallbackAttempt = await requestGraphqlPlan(graphqlEndpoint, fallbackPayload);
            if (fallbackAttempt.ok && fallbackAttempt.json?.data?.plan) {
                const itineraries = fallbackAttempt.json.data.plan.itineraries || [];
                res.status(200).json({ plan: { itineraries: mapGraphqlItineraries(itineraries) } });
                return;
            }
            res.status(502).json({
                error: {
                    message: "OTP GraphQL error",
                    detail: fallbackAttempt.json?.errors || graphqlAttempt.json.errors,
                },
            });
            return;
        }

        if (planQuery) {
            const urls = getCandidatePlanUrls(routerId, planQuery);
            let lastError = graphqlAttempt.json?.errors || graphqlAttempt.json?.error || null;
            for (const url of urls) {
                const otpRes = await fetch(url);
                const text = await otpRes.text();
                try {
                    const payload = JSON.parse(text);
                    if (otpRes.ok) {
                        res.status(200).json(payload);
                        return;
                    }
                    lastError = payload?.error || payload;
                } catch (parseError) {
                    lastError = text;
                }
            }
            res.status(502).json({ error: "OTP plan request failed", detail: lastError });
            return;
        }
        res.status(502).json({
            error: "OTP GraphQL request failed without date/time.",
            detail: graphqlAttempt.json?.errors || graphqlAttempt.json?.error || null,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to reach OpenTripPlanner." });
    }
};
