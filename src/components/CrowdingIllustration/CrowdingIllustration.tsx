import React from "react";
import classNames from "classnames";
import Random from "random";
import { GiPerson } from "react-icons/gi";

import { CrowdingLevel } from "types";

import styles from "./CrowdingIllustration.module.scss";

interface Props {
    crowding: CrowdingLevel | number;
    height?: number;
    perLayer?: number;
}

const getPersonProps = (position: number, height: number, layer: number) => {
    return {
        style: {
            zIndex: -layer,
            color: "#" + (layer * (255 / 3)).toString(16).repeat(3),
            left: `${Math.min(95, Math.max(0, position))}%`,
        },
        size: `${(1 - layer * 0.05) * height}px`,
    };
};

export const CrowdingIllustration: React.FunctionComponent<Props> = (props) => {
    const { crowding, height: totalHeight = 50, perLayer = 15 } = props;
    const totalLayers = Math.ceil(crowding / perLayer);
    const random = Random.clone("yes");
    const getOffset = random.uniform(-2, 2);
    const getLayerMix = random.uniformInt(0, 1);
    const getHeight = random.normal(totalHeight, totalHeight * 0.05);

    const renderPerson = (index) => {
        const layer = (index + getLayerMix()) % totalLayers;
        const position = getOffset() + 100 * (index / crowding);
        const height = getHeight();
        return (
            <GiPerson
                key={index}
                className={styles.person}
                {...getPersonProps(position, height, layer)}
            />
        );
    };

    return (
        <div
            className={classNames(styles.crowdingIllustration, "crowding-illustration")}
            style={{ height: totalHeight }}
        >
            {Array(crowding)
                .fill(0)
                .map((_, i) => renderPerson(i))}
            <div className={styles.platform} />
        </div>
    );
};
