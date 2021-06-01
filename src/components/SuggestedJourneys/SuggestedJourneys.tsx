import React from "react";


import styles from "./SuggestedJourneys.module.scss";

interface j1 {
    origin: string;
    destination: string;
}

type Props = { 
    journey1: j1;
}



const SuggestedJourneys = (props: Props) => {
    const { journey1 } = props;
    return (

    <div className={styles.journey1}> 
        {/* <Button onClick={action("click")} large></Button> */}
        <a href="/?from=place-NEC-2173&to=place-bbsta&day=weekday&time=32010"><h2>Journey Option 1:</h2>
        <p>Depart from: { journey1.origin }
        <p></p>Arrive at: { journey1.destination }</p></a>
    </div>
    
    );
};

export default SuggestedJourneys; 