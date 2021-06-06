import React from "react";
import { stationsById } from "stations";
import { JourneyParams } from "types";

import styles from "./SuggestedJourneys.module.scss";

interface journey {
    // origin: string;
    // destination: string;
    // originStationId: JourneyParams["fromStationId"];
    // destStationId: JourneyParams["toStationId"];
    // day: JourneyParams["day"];
    // time: JourneyParams["time"];
    params: JourneyParams;
    fromStationName: string;
    toStationName: string;
}

type Props = { 
    journeys: journey[];
}

export function getJourneyUrl(fromStationId: string, toStationId: string, day: string, time: number | undefined) {
    return `/?from=${fromStationId}&to=${toStationId}&day=${day}&time=${time}`;
}

const SuggestedJourneys = (props: Props) => {
    const { journeys } = props;
    let divArr = [] as any;
    for (let i = 0; i < journeys.length; ++i) {
        divArr.push(
            <div className={styles.journey}> 
                 <a href={getJourneyUrl(journeys[i].params["fromStationId"], journeys[i].params["toStationId"], journeys[i].params["day"], journeys[i].params["time"])}>
                 <h2>Journey Option {i + 1}:</h2>
                 <p>Depart from: { journeys[i].fromStationName }</p>
                 <p>Arrive at: { journeys[i].toStationName }</p></a>
             </div>
        );
    } 
    return divArr;
    // return (
    // <div className={styles.journey1}> 
    //     {/* <Button onClick={action("click")} large></Button> */}
    //     <a href={getJourneyUrl(journeys[i].params["fromStationId"], journeys.params["toStationId"], journeys.params["day"], journeys.params["time"])}><h2>Journey Option 1:</h2>
    //     <p>Depart from: { journeys.fromStationName }
    //     <p></p>Arrive at: { journeys.toStationName }</p></a>
    // </div>
    // );  
};

export default SuggestedJourneys; 