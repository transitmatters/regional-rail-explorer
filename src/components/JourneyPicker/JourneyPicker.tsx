import React, { useState } from "react";
import { GrDown } from "react-icons/gr";

import Button from "components/Button/Button";
import StationPicker, { StationsByLine } from "components/StationPicker/StationPicker";

import styles from "./JourneyPicker.module.scss";

interface Props {
    stationsByLine: StationsByLine;
    stationsById: Record<string, { id: string; name: string }>;
}

const JourneyPicker = (props: Props) => {
    const { stationsByLine, stationsById } = props;
    const [fromStation, setFromStation] = useState(null);
    const [toStation, setToStation] = useState(null);

    return (
        <div className={styles.journeyPicker}>
            <div>From</div>
            <StationPicker
                onSelectStation={(stationId) => setFromStation(stationsById[stationId])}
                stationsByLine={stationsByLine}
            >
                {(discProps) => (
                    <Button large rightIcon={<GrDown />} {...discProps}>
                        {fromStation ? fromStation.name : "Choose a station"}
                    </Button>
                )}
            </StationPicker>
            <div>To</div>
            <StationPicker
                onSelectStation={(stationId) => setToStation(stationsById[stationId])}
                stationsByLine={stationsByLine}
                previouslySelectedStationId={fromStation && fromStation.id}
            >
                {(discProps) => (
                    <Button large rightIcon={<GrDown />} {...discProps}>
                        {toStation ? toStation.name : "Choose a station"}
                    </Button>
                )}
            </StationPicker>
        </div>
    );
};

export default JourneyPicker;
