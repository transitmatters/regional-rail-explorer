import React from "react";

import { stationsByLine, stationsById } from "storydata/stationsByLine";
import * as salem from "storydata/salem";
import { baseline, enhanced } from "storydata/journey";

import { JourneyInfo, CrowdingLevel } from "types";
import { DeparturePicker, JourneyPicker, JourneyComparison } from "components";
import { HOUR } from "time";

const baselineInfo: JourneyInfo = {
    scenario: {
        name: "Today's Commuter Rail",
    },
    segments: baseline,
    platformCrowding: {
        "place-ER-0168": {
            station: {
                name: "Salem",
                id: "place-ER-0168",
            },
            crowdingLevel: CrowdingLevel.High,
        },
    },
    arrivals: {
        "place-ER-0168": {
            station: {
                name: "Salem",
                id: "place-ER-0168",
            },
            times: salem.baselineArrivals,
        },
    },
    amenities: [],
};

const enhancedInfo: JourneyInfo = {
    scenario: {
        name: "Regional Rail Phase 1",
    },
    segments: enhanced,
    platformCrowding: {
        "place-ER-0168": {
            station: {
                name: "Salem",
                id: "place-ER-0168",
            },
            crowdingLevel: CrowdingLevel.Low,
        },
    },
    arrivals: {
        "place-ER-0168": {
            station: {
                name: "Salem",
                id: "place-ER-0168",
            },
            times: salem.enhancedArrivals,
        },
    },
    amenities: ["electric-trains", "level-boarding", "increased-top-speed"],
};

const Explorer = (props) => {
    return (
        <div className="explorer">
            <JourneyPicker
                stationsById={stationsById}
                stationsByLine={stationsByLine}
                initialFromStation={{ id: "place-ER-0168", name: "Salem" }}
                initialToStation={{ id: "place-DB-2258", name: "Uphams Corner" }}
            />
            <DeparturePicker
                enhancedArrivals={salem.enhancedArrivals}
                baselineArrivals={salem.baselineArrivals}
                spanFullDay={false}
                timePadding={HOUR / 2}
                onSelectTime={() => {}}
                onUpdateTime={() => {}}
            />
            <JourneyComparison baseline={baselineInfo} enhanced={enhancedInfo} />
        </div>
    );
};

export default Explorer;
