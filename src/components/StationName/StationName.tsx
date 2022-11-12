import { JourneyStation } from "types";
import styles from "./StationName.module.scss";

type Props = {
    station: JourneyStation;
    route?: string; // to be used to determine if station is an infill
    asLink?: boolean; // only render as a link if this is
    link?: string; // link to display on the station name
    time?: string; // time the station is reached (for endpoints)
    withCircle?: boolean; // whether to show a circle with the name
};

const isInfillStation = (stationId, route) => {
    const alwaysInfills = new Set([
        "place-rr-everett-jct",
        "place-rr-revere-center",
        "place-rr-south-salem",
        "place-rr-tufts-university",
        "place-rr-montvale-avenue",
        "place-rr-umass-lowell",
        "place-rr-rourke-bridge",
        "place-rr-willow-springs",
        "place-rr-nashua",
        "place-rr-merrimack",
        "place-rr-manchester-center",
        "place-rr-brickbottom",
        "place-rr-clematis-brook",
        "place-rr-weston-128",
        "place-rr-ceylon-park",
        "place-rr-river-street",
        "place-rr-west-station",
        "place-rr-newton-corner",
        "place-rr-pawtucket",
        "place-rr-hingham-depot",
        "place-rr-cohasset-center",
        "place-rr-braintree-highlands",
        "place-rr-bridgewater-center",
        "place-rr-mboro-centre-st",
        "place-rr-weymouth-col-sq",
        "place-rockland-n-abington",
        "place-kingston-jct",
        "place-plymouth-center",
    ]);
    const infillInRoute = {
        "CR-Newburyport": new Set(["place-sull"]),
        "CR-Reading": new Set(["place-sull"]),
        "CR-Fitchburg": new Set(["place-unsqu"]),
    };
    if (alwaysInfills.has(stationId)) {
        return true;
    }
    if (infillInRoute[route] && infillInRoute[route].has(stationId)) {
        return true;
    }
    return false;
};

const StationName = (props: Props) => {
    const { station, route = "", asLink = false, link = "", time, withCircle } = props;
    const showInfillStatus = isInfillStation(station.id, route);
    return (
        <div
            className={time ? styles.travelSegmentEndpointInfill : styles.travelSegmentPassedInfill}
        >
            {withCircle && <div className="circle" />}
            {asLink ? (
                <a href={link} className={styles.stationName}>
                    {station.name}
                </a>
            ) : (
                <span className={styles.stationName}>{station.name}</span>
            )}
            {time && <div className="time">{time}</div>}
            {showInfillStatus && (
                <div className="plus">
                    +<span className="tooltiptext">New station</span>
                </div>
            )}
        </div>
    );
};

export default StationName;
