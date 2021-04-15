import React, { useMemo } from "react";

import { useSvgLayout } from "hooks";

import { prerenderNetwork } from "./network";

interface Props {
    curveRadius?: number;
}

const NetworkVisualizer = (props: Props) => {
    const { curveRadius } = props;
    const { pathDirective } = useMemo(() => prerenderNetwork(curveRadius), [curveRadius]);
    const svgProps = useSvgLayout();

    return (
        <svg {...svgProps} style={{ height: 800 }} aria-hidden="true">
            <path d={pathDirective} fill="transparent" strokeWidth={4} stroke="black" />
        </svg>
    );
};

export default NetworkVisualizer;
