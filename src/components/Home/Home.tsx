import React, { useCallback } from "react";
import classNames from "classnames";
import { Button } from "reakit/Button";
import { GiElectric } from "react-icons/gi";
import { IoMdTimer } from "react-icons/io";
import { MdGridOn } from "react-icons/md";

import { useViewport } from "hooks";
import { LiveNetworkVisualizer, PowerText, SuggestedJourneys } from "components";

import OverviewCircle from "./OverviewCircle";

import styles from "./Home.module.scss";

const Home = () => {
    const { viewportHeight } = useViewport();

    const handleScrollToDetails = useCallback(() => {
        document.getElementById("details")?.scrollIntoView({ behavior: "smooth" });
    }, []);

    if (viewportHeight) {
        return (
            <div className={styles.home}>
                <div className={styles.screen}>
                    <img className={styles.tmLogo} src="/tm-logo.svg" />
                    <LiveNetworkVisualizer
                        className={styles.network}
                        trainClassName={styles.train}
                        lineClassName={styles.line}
                        height={viewportHeight * 0.5}
                        curveRadius={10}
                    />
                    <div className={styles.text}>
                        <PowerText cool={false}>Regional Rail Explorer</PowerText>
                        <div className={styles.subtitle}>
                            Plan a trip on a frequent, electrified Regional Rail network for Greater
                            Boston.
                        </div>
                        <Button className={styles.enterButton} onClick={handleScrollToDetails}>
                            Let's go
                        </Button>
                    </div>
                </div>
                <div id="details" className={classNames(styles.screen, styles.detailsScreen)}>
                    <PowerText cool={false}>What is Regional Rail?</PowerText>
                    <p>TransitMatters' plan imagines a MBTA Commuter Rail network that is:</p>
                    <div className={classNames(styles.section, styles.overview)}>
                        <div className={styles.overviewEntry}>
                            <OverviewCircle>
                                <IoMdTimer />
                            </OverviewCircle>
                            <h2>Frequent</h2>
                            <p>
                                Trains come at predictable intervals at least twice an hour, all
                                day. Near Boston, the system approaches subway frequencies. No need
                                to check a schedule — just show up and go.
                            </p>
                        </div>
                        <div className={styles.overviewEntry}>
                            <OverviewCircle>
                                <GiElectric />
                            </OverviewCircle>
                            <h2>Electrified</h2>
                            <p>
                                Modern trains reach top speed quickly, instantly shaving time off
                                your commute. No more delays or canceled trips caused by faulty
                                diesel trains. Ready for a carbon-neutral world.
                            </p>
                        </div>
                        <div className={styles.overviewEntry}>
                            <OverviewCircle>
                                <MdGridOn />
                            </OverviewCircle>
                            <h2>Integrated</h2>
                            <p>
                                Completely accessible stations serve the heart of Greater Boston's
                                most walkable communities. Regional Rail trains don't cost more to
                                ride than the subway or the bus.
                            </p>
                        </div>
                    </div>
                    <hr />
                    <div className={styles.section}>
                        <PowerText cool={false}>Ready to take a ride?</PowerText>
                        <p>See the difference with one of these trips, or choose your own.</p>
                        <SuggestedJourneys />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default Home;
