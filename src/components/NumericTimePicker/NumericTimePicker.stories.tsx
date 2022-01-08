import React, { useState } from "react";

import { HOUR } from "time";

import NumericTimePicker from "./NumericTimePicker";

export default {
    title: "NumericTimePicker",
    component: NumericTimePicker,
};

export const Default = () => {
    const [time, setTime] = useState(HOUR * 11.5);

    return <NumericTimePicker time={time} onSelectTime={setTime} />;
};
