import React, { useCallback, useMemo, useState } from "react";
import classNames from "classnames";
import { Button } from "reakit/Button";
import { GiElectric } from "react-icons/gi";
import { IoMdTimer } from "react-icons/io";
import { MdGridOn } from "react-icons/md";

import { useAppContext, useViewport } from "hooks";
import { LiveNetworkVisualizer, PowerText, SuggestedJourneys } from "components";

import OverviewCircle from "./OverviewCircle";

import styles from "./Home.module.scss";
import { CgChevronDoubleDown } from "react-icons/cg";

const Home = () => {
    const { viewportHeight } = useViewport();
    const { isMobile } = useAppContext();
    const [initialViewportHeight] = useState(viewportHeight);

    const visualizerHeight = useMemo(() => {
        if (isMobile) {
            return initialViewportHeight! * 0.5;
        }
        return viewportHeight! * 0.5;
    }, [initialViewportHeight, viewportHeight, isMobile]);

    const handleScrollToDetails = useCallback(() => {
        document.getElementById("details")?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const journeySelection = (
        <>
            <PowerText cool={false}>Ready to take a ride?</PowerText>
            <p>See the difference with one of these trips, or choose your own.</p>
            <SuggestedJourneys />
        </>
    );

    const nextScreenArrow = (
        <CgChevronDoubleDown size={30} className={classNames(styles.nextScreenArrow, "hovering")} />
    );

    if (viewportHeight) {
        return (
            <div className={styles.home}>
                <div className={styles.screen}>
                    <a href="//transitmatters.org">
                        <img className={styles.tmLogo} src="/tm-logo.svg" />
                    </a>
                    <LiveNetworkVisualizer
                        className={styles.network}
                        trainClassName={styles.train}
                        lineClassName={styles.line}
                        height={visualizerHeight}
                        curveRadius={10}
                    />
                    <div className={styles.text}>
                        <PowerText cool={false}>Regional Rail Explorer</PowerText>
                        <div className={styles.subtitle}>
                            Plan a trip on a frequent, electrified Regional Rail network for Greater
                            Boston.
                        </div>
                        {!isMobile && (
                            <Button className={styles.enterButton} onClick={handleScrollToDetails}>
                                Let's go
                            </Button>
                        )}
                        {isMobile && nextScreenArrow}
                    </div>
                </div>
                <div id="details" className={classNames(styles.screen, styles.detailsScreen)}>
                    <PowerText cool={false}>What is Regional Rail?</PowerText>
                    <p>TransitMatters' plan imagines an MBTA Commuter Rail network that is:</p>
                    <div className={classNames(styles.section, styles.overview)}>
                        <div className={styles.overviewEntry}>
                            <OverviewCircle className={styles.overviewCircle}>
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
                            <OverviewCircle className={styles.overviewCircle}>
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
                            <OverviewCircle className={styles.overviewCircle}>
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
                    {!isMobile && (
                        <>
                            <hr />
                            <div className={styles.section}>{journeySelection}</div>
                        </>
                    )}
                    {isMobile && nextScreenArrow}
                </div>
                <div className={styles.scrollSnapEnd} />
                {isMobile && (
                    <>
                        <div className={styles.screen}>{journeySelection}</div>
                        <div className={styles.scrollSnapEnd} />
                    </>
                )}
            </div>
        );
    }

    return null;
};

export default Home;
