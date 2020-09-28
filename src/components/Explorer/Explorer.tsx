import React, { useState, useEffect } from "react";

import { stationsByLine, stationsById } from "stations";
import * as salem from "storydata/salem";
import { baseline, enhanced } from "storydata/journey";

import * as api from "api";
import { JourneyInfo, CrowdingLevel, JourneyParams, NetworkTime } from "types";
import { DeparturePicker, JourneyPicker, JourneyComparison } from "components";
import { HOUR } from "time";

const scenarioNames = ["present", "phase_one"];

const Explorer = () => {
    const [journeyParams, setJourneyParams] = useState<JourneyParams>();
    const [arrivals, setArrivals] = useState<NetworkTime[][]>(null);
    const [journeys, setJourneys] = useState<JourneyInfo[]>(null);

    useEffect(() => {
        if (journeyParams) {
            const { fromStationId, toStationId, day } = journeyParams;
            api.arrivals(fromStationId, toStationId, day, scenarioNames).then(setArrivals);
        }
    }, [
        journeyParams && journeyParams.fromStationId,
        journeyParams && journeyParams.toStationId,
        journeyParams && journeyParams.day,
    ]);

    useEffect(() => {
        if (journeyParams && journeyParams.time) {
            const { fromStationId, toStationId, day, time } = journeyParams;
            api.journeys(fromStationId, toStationId, day, time, scenarioNames).then(setJourneys);
        }
    }, [journeyParams]);

    const renderDeparturePicker = () => {
        if (journeyParams && arrivals) {
            const [baselineArrivals, enhancedArrivals] = arrivals;
            return (
                <DeparturePicker
                    baselineArrivals={baselineArrivals}
                    enhancedArrivals={enhancedArrivals}
                    spanFullDay={false}
                    onSelectTime={(time) => setJourneyParams({ ...journeyParams, time })}
                    time={journeyParams.time}
                />
            );
        }
        return null;
    };

    const renderJourneyComparison = () => {
        if (journeys) {
            const [baseline, enhanced] = journeys;
            return <JourneyComparison baseline={baseline} enhanced={enhanced} />;
        }
        return null;
    };

    return (
        <div className="explorer">
            <JourneyPicker
                stationsById={stationsById}
                stationsByLine={stationsByLine}
                onSelectJourney={setJourneyParams}
            />
            {renderDeparturePicker()}
            {renderJourneyComparison()}
        </div>
    );
};

export default Explorer;
