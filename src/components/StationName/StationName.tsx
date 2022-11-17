import { getLinkToStation, isInfillStation } from "stations";
import { JourneyStation } from "types";
import styles from "./StationName.module.scss";

type Props = {
    station: JourneyStation;
    onRouteId?: string; // to be used to determine if station is an infill
    asLink?: boolean; // only render as a link if this is
};

const StationName = (props: Props) => {
    const { station, onRouteId, asLink = false } = props;
    const showInfillStatus = onRouteId && isInfillStation(station.id, onRouteId);
    return (
        <div className={styles.stationNameWithPlus}>
            {asLink ? (
                <a href={getLinkToStation(station)} className={styles.stationName}>
                    {station.name}
                </a>
            ) : (
                <span className={styles.stationName}>{station.name}</span>
            )}
            {showInfillStatus && (
                <div className="plus">
                    +<span className="tooltiptext">New station</span>
                </div>
            )}
        </div>
    );
};

export default StationName;
