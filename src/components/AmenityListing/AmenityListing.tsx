import React from "react";
import classNames from "classnames";
import { FaAccessibleIcon } from "react-icons/fa";
import { GiElectric } from "react-icons/gi";
import { IoMdSpeedometer } from "react-icons/io";

import { Amenity } from "types";

import styles from "./AmenityListing.module.scss";

const amenityToString: Record<Amenity, { presence: string; absence: string; icon: any }> = {
    "electric-trains": {
        icon: (props) => <GiElectric {...props} size="1.2em" />,
        presence: "Fast, quiet, and reliable electric train",
        absence: "Legacy diesel train",
    },
    "level-boarding": {
        icon: (props) => <FaAccessibleIcon {...props} size="1.1em" />,
        presence: "High platforms for quick and accessible boarding",
        absence: "Step-up platform creates delays in boarding",
    },
    "increased-top-speed": {
        icon: (props) => <IoMdSpeedometer {...props} size="1.1em" />,
        presence: "Modern tracks and signals ensure trains can run at full speed",
        absence: "Speed restrictions artifically limit the top speed of trains",
    },
};

type Props = {
    present?: Amenity[];
    absent?: Amenity[];
};

const AmenityListing = (props: Props) => {
    const { present = [], absent = [] } = props;

    const renderAmenity = (amenity: Amenity, present: boolean) => {
        const { presence, absence, icon: Icon } = amenityToString[amenity];
        return (
            <li className={styles.amenity}>
                <div className={classNames("icon-wrapper", present && "present")}>
                    <Icon color="white" />
                    <div className="slash" />
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
