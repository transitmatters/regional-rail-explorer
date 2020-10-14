import React, { useState, useEffect } from "react";
import { GrDown } from "react-icons/gr";
import { useRouter } from 'next/router'

import Button from "components/Button/Button";
import StationPicker, { StationsByLine } from "components/StationPicker/StationPicker";
import { JourneyParams } from "types";

import styles from "./JourneyPicker.module.scss";
import { parseTime } from "time";

interface Station {
    id: string;
    name: string;
}
interface Props {
    stationsByLine: StationsByLine;
    stationsById: Record<string, Station>;
    initialFromStation?: Station;
    initialToStation?: Station;
    onSelectJourney: (params: JourneyParams) => any;
}

const JourneyPicker = (props: Props) => {
    const router = useRouter()
    const {
        stationsByLine,
        stationsById,
        initialFromStation,
        initialToStation,
        onSelectJourney,
    } = props;
    const [fromStation, setFromStation] = useState(initialFromStation);
    const [toStation, setToStation] = useState(initialToStation);

    useEffect(() => {
        if (router.query.from && router.query.to) {
            setFromStation(stationsById[router.query.from.toString()])
            setToStation(stationsById[router.query.to.toString()])
        }
    }, [router.query.from, router.query.to])

    useEffect(() => {
        if (fromStation && toStation) {
            onSelectJourney({
                fromStationId: fromStation.id,
                toStationId: toStation.id,
                day: "weekday",
            });
            router.push(`/?from=${fromStation.id}&to=${toStation.id}&day=weekday`, undefined, { shallow: true });
        }
    }, [fromStation, toStation]);

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
