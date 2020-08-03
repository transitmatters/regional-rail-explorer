import React from "react";
import { GrDown } from "react-icons/gr";

import Button from "components/Button/Button";
import StationPicker, { StationsByLine } from "components/StationPicker/StationPicker";

import styles from "./JourneyPicker.module.scss";

interface Props {
    stationsByLine: StationsByLine;
}

const JourneyPicker = (props: Props) => {
    const { stationsByLine } = props;

    const renderStationPicker = (label: string, onSelectStation) => (
        <StationPicker onSelectStation={onSelectStation} stationsByLine={stationsByLine}>
            {(discProps) => (
                <Button large rightIcon={<GrDown />} {...discProps}>
                    {label}
                </Button>
            )}
        </StationPicker>
    );

    return (
        <div className={styles.journeyPicker}>
            <div>From</div>
            {renderStationPicker("Choose a station", () => {})}
            <div>To</div>
            {renderStationPicker("Choose a station", () => {})}
        </div>
    );
};

export default JourneyPicker;
