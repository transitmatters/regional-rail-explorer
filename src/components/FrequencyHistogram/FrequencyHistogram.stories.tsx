import * as React from "react";
import { storiesOf } from "@storybook/react";

import FrequencyHistogram from "./FrequencyHistogram";
import { parseTime, stringifyTime } from "../../time";
import { generateTimesByClockfaceSchedule } from "../../schedule";

const baselineArrivals = [
    "5:37",
    "5:51",
    "6:22",
    "6:31",
    "6:57",
    "7:13",
    "7:33",
    "7:53",
    "8:02",
    "8:28",
    "8:37",
    "8:58",
    "9:46",
    "10:02",
    "10:31",
    "11:42",
    "12:11",
    "13:12",
    "13:41",
    "14:32",
    "15:26",
    "16:12",
    "17:15",
    "17:36",
    "17:49",
    "18:24",
    "18:29",
    "19:39",
    "19:57",
    "20:40",
    "21:27",
    "21:53",
    "23:12",
    "23:34",
].map(parseTime);

const enhancedArrivals = generateTimesByClockfaceSchedule(
    {
        "5:00-6:00": 2,
        "7:00-10:30": 5,
        "10:30-12:00": 4,
        "12:00-15:00": 3,
        "15:00-16:30": 4,
        "16:30-20:00": 5,
        "20:00-22:00": 3,
        "22:00-24:00": 2,
    },
    7
);

storiesOf("FrequencyHistogram", module).add("default", () => {
    return (
        <FrequencyHistogram
            enhancedArrivals={enhancedArrivals}
            baselineArrivals={baselineArrivals}
        />
    );
});
