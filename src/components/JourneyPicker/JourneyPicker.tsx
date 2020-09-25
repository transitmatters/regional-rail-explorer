import React, { useState } from "react";
import { GrDown } from "react-icons/gr";

import Button from "components/Button/Button";
import StationPicker, { StationsByLine } from "components/StationPicker/StationPicker";

import styles from "./JourneyPicker.module.scss";

interface Station {
    id: string;
    name: string;
}
interface Props {
    stationsByLine: StationsByLine;
    stationsById: Record<string, Station>;
    initialFromStation?: Station;
    initialToStation?: Station;
}

const JourneyPicker = (props: Props) => {
    const { stationsByLine, stationsById, initialFromStation, initialToStation } = props;
    const [fromStation, setFromStation] = useState(initialFromStation);
    const [toStation, setToStation] = useState(initialToStation);

    return (
        <div className={styles.journeyPicker}>
            <div className="group">
                <div className="label">From</div>
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
                <div className="label">to</div>
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
            <div className="group">
                <div className="label">Leave during</div>
                <Button large rightIcon={<GrDown />}>
                    Morning
                </Button>
                <div className="label">on a</div>
                <Button large rightIcon={<GrDown />}>
                    Weekday
                </Button>
            </div>
        </div>
    );
};

export default JourneyPicker;
