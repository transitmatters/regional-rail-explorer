import React from "react";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAccessibleIcon } from "@fortawesome/free-brands-svg-icons";
import { faBolt, faGasPump, faGaugeHigh, faTrain } from "@fortawesome/free-solid-svg-icons";

import { AmenityName } from "types";

import styles from "./AmenityListing.module.scss";

const amenityToString: Record<
    AmenityName,
    { presence: string; absence: string; icon: any; absenceIcon?: any }
> = {
    electricTrains: {
        icon: (props) => <FontAwesomeIcon {...props} icon={faBolt} style={{ fontSize: "1.2em" }} />,
        absenceIcon: (props) => (
            <FontAwesomeIcon {...props} icon={faGasPump} style={{ fontSize: "0.95em" }} />
        ),
        presence: "Fast, quiet, and reliable electric train",
        absence: "Legacy diesel train",
    },
    levelBoarding: {
        icon: (props) => (
            <FontAwesomeIcon {...props} icon={faAccessibleIcon} style={{ fontSize: "1.1em" }} />
        ),
        presence: "High platforms for quick and accessible boarding",
        absence: "Step-up platform creates delays in boarding",
    },
    increasedTopSpeed: {
        icon: (props) => (
            <FontAwesomeIcon
                {...props}
                icon={faGaugeHigh}
                style={{ fontSize: "1.1em", transform: "scaleX(-1)" }}
            />
        ),
        absenceIcon: (props) => (
            <FontAwesomeIcon {...props} icon={faGaugeHigh} style={{ fontSize: "1.1em" }} />
        ),
        presence: "Modern tracks and signals ensure trains can run at full speed",
        absence: "Speed restrictions artifically limit the top speed of trains",
    },
};

type Props = {
    present?: AmenityName[];
    absent?: AmenityName[];
    // Show a single "no train" item instead of amenities, for a scenario with no trip at all
    noService?: boolean;
};

const AmenityListing: React.FunctionComponent<Props> = (props) => {
    const { present = [], absent = [], noService = false } = props;

    if (noService) {
        return (
            <ul className={styles.amenityListing}>
                <li className={styles.amenity}>
                    <div className="icon-wrapper">
                        <FontAwesomeIcon
                            icon={faTrain}
                            color="whitesmoke"
                            style={{ fontSize: "0.95em" }}
                        />
                        <div className="slash" />
                    </div>
                    <span className="label">No train today</span>
                </li>
            </ul>
        );
    }

    const renderAmenity = (amenity: AmenityName, present: boolean) => {
        const { presence, absence, icon, absenceIcon } = amenityToString[amenity];
        const Icon = !present && absenceIcon ? absenceIcon : icon;
        const showSlash = !present && !absenceIcon;
        return (
            <li key={`${amenity}-${present}`} className={styles.amenity}>
                <div className={classNames("icon-wrapper", present && "present")}>
                    <Icon color={present ? "white" : "whitesmoke"} />
                    {showSlash && <div className={"slash"} />}
                </div>
                <span className="label">{present ? presence : absence}</span>
            </li>
        );
    };

    return (
        <ul className={styles.amenityListing}>
            {present.map((amenity) => renderAmenity(amenity, true))}
            {absent.map((amenity) => renderAmenity(amenity, false))}
        </ul>
    );
};

export default AmenityListing;
