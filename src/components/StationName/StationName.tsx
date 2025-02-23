import React from "react";
import { HiPlusCircle } from "react-icons/hi";
import classNames from "classnames";

import { getLinkToStation, isInfillStation } from "stations";
import { JourneyStation } from "types";

import styles from "./StationName.module.scss";

type Props = {
    station: JourneyStation;
    onRouteId?: string; // to be used to determine if station is an infill
    asLink?: boolean; // only render as a link if this is
    fullWidth?: boolean; // for makes the infill icons look better in StationListing
    infillIndicatorUsesTextColor?: boolean; // used for stations on selectedLine in StationListing
};

const StationName: React.FunctionComponent<Props> = (props) => {
    const {
        station,
        onRouteId,
        asLink = false,
        fullWidth = false,
        infillIndicatorUsesTextColor = false,
    } = props;
    const showInfillStatus = onRouteId && isInfillStation(station.id, onRouteId);
    return (
        <div
            className={classNames(
                styles.stationName,
                fullWidth && styles.fullWidth,
                infillIndicatorUsesTextColor && styles.infillIndicatorUsesTextColor
            )}
        >
            {asLink ? (
                <a href={getLinkToStation(station)} className={styles.nameText}>
                    {station.name}
                </a>
            ) : (
                <span className={styles.nameText}>{station.name}</span>
            )}
            {showInfillStatus && (
                <div className={styles.infillStatus} tabIndex={0}>
                    <HiPlusCircle className={styles.plus} />
                    <span className={styles.tooltipText}>New station</span>
                </div>
            )}
        </div>
    );
};

export default StationName;
