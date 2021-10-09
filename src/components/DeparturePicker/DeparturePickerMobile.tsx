import React, { useState, useRef } from "react";

import { NetworkTime, NetworkTimeRange } from "types";

import DeparturePickerChrome from "./DeparturePickerChrome";
import { DeparturePickerImplProps } from "./types";

import styles from "./DeparturePicker.module.scss";

type Props = DeparturePickerImplProps & {
    sensitivity?: number;
    expansion?: number;
    time: number;
};

const getTimeDeltaForMouseOffset = (
    initialOffset: number,
    currentOffset: number,
    timeRange: NetworkTimeRange,
    sensitivity: number,
    timelineWrapper: HTMLDivElement
) => {
    const { width: timelineWidth } = timelineWrapper.getBoundingClientRect();
    const [start, end] = timeRange;
    const secondsPerPixel = (end - start) / timelineWidth;
    return sensitivity * secondsPerPixel * (initialOffset - currentOffset);
};

const getOffsetForTime = (
    time: NetworkTime,
    timeRange: NetworkTimeRange,
    timelineWrapper: null | HTMLDivElement
) => {
    if (timelineWrapper) {
        const { width: timelineWidth } = timelineWrapper.getBoundingClientRect();
        const [start, end] = timeRange;
        const progress = (time - start) / (end - start);
        return -1 * timelineWidth * progress;
    }
    return 0;
};

const DeparturePickerMobile = (props: Props) => {
    const {
        disabled = false,
        onSelectTime,
        time,
        sensitivity = 2.5,
        expansion = 3,
        timeRange,
        timeline,
    } = props;

    const [capturedTime, setCapturedTime] = useState<number>(time);
    const [isCapturing, setIsCapturing] = useState(false);
    const captureMouseX = useRef<null | number>(null);
    const timelineWrapper = useRef<null | HTMLDivElement>(null);

    const offset = getOffsetForTime(
        isCapturing ? capturedTime! : time,
        timeRange,
        timelineWrapper.current
    );

    const startCapture = (offsetX: number) => {
        captureMouseX.current = offsetX;
        setIsCapturing(true);
        document.body.style.overflow = "hidden";
    };

    const updateCapture = (offsetX: number) => {
        if (isCapturing) {
            const [start, end] = timeRange;
            const timeDelta = getTimeDeltaForMouseOffset(
                captureMouseX.current!,
                offsetX,
                timeRange,
                sensitivity,
                timelineWrapper.current!
            );
            const nextCapturedTime = Math.min(Math.max(time + timeDelta, start), end);
            setCapturedTime(nextCapturedTime);
        }
    };

    const endCapture = () => {
        setIsCapturing(false);
        onSelectTime(capturedTime);
        document.body.style.overflow = "visible";
    };

    return (
        <div
            className={styles.departurePickerMobile}
            onMouseDown={(e) => startCapture(e.clientX)}
            onTouchStart={(e) => startCapture(e.touches[0].clientX)}
            onMouseMove={(e) => updateCapture(e.clientX)}
            onTouchMove={(e) => updateCapture(e.touches[0].clientX)}
            onMouseUp={endCapture}
            onTouchEnd={endCapture}
        >
            <DeparturePickerChrome disabled={disabled} indicatorPositionFraction={0.5}>
                <div
                    ref={timelineWrapper}
                    style={{
                        position: "relative",
                        width: `${100 * expansion}%`,
                        left: "50%",
                        transform: `translateX(${offset}px)`,
                    }}
                >
                    {timeline}
                </div>
            </DeparturePickerChrome>
        </div>
    );
};

export default DeparturePickerMobile;
