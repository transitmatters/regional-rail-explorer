import { useState, useLayoutEffect } from "react";

interface UseSvgLayoutOptions {
    paddingX?: number;
    paddingY?: number;
}

export const useSvgLayout = (options: UseSvgLayoutOptions = {}) => {
    const { paddingX = 4, paddingY = 4 } = options;

    const [viewBox, setViewBox] = useState(undefined);
    const [svg, setSvg] = useState(null);

    useLayoutEffect(() => {
        if (svg) {
            const bbox = svg.getBBox();
            const x = bbox.x - paddingX;
            const width = bbox.width + paddingX * 2;
            const y = bbox.y - paddingY;
            const height = bbox.height + paddingY * 2;
            setViewBox(`${x} ${y} ${width} ${height}`);
        }
    }, [svg]);

    return {
        viewBox,
        ref: setSvg,
        preserveaspectratio: "xMidYMin",
    };
};
