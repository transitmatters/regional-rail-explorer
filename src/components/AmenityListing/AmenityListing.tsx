import React from "react";
import classNames from "classnames";
import { FaAccessibleIcon, FaGasPump } from "react-icons/fa";
import { GiElectric } from "react-icons/gi";
import { IoMdSpeedometer } from "react-icons/io";

import { AmenityName } from "types";

import styles from "./AmenityListing.module.scss";

const amenityToString: Record<
    AmenityName,
    { presence: string; absence: string; icon: any; absenceIcon?: any }
> = {
    electricTrains: {
        icon: (props) => <GiElectric {...props} size="1.4em" />,
        absenceIcon: (props) => <FaGasPump {...props} size="0.95em" />,
        presence: "Fast, quiet, and reliable electric train",
        absence: "Legacy diesel train",
    },
    levelBoarding: {
        icon: (props) => <FaAccessibleIcon {...props} size="1.1em" />,
        presence: "High platforms for quick and accessible boarding",
        absence: "Step-up platform creates delays in boarding",
    },
    increasedTopSpeed: {
        icon: (props) => (
            <IoMdSpeedometer {...props} size="1.25em" style={{ transform: "scaleX(-1)" }} />
        ),
        absenceIcon: (props) => <IoMdSpeedometer {...props} size="1.25em" />,
        presence: "Modern tracks and signals ensure trains can run at full speed",
        absence: "Speed restrictions artifically limit the top speed of trains",
    },
};

type Props = {
    present?: AmenityName[];
    absent?: AmenityName[];
};

const AmenityListing = (props: Props) => {
    const { present = [], absent = [] } = props;

    const renderAmenity = (amenity: AmenityName, present: boolean) => {
        console.log("A2S", amenityToString, amenity);
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
