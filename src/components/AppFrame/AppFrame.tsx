import React, { useRef } from "react";
import classNames from "classnames";
import Head from "next/head";
import { Provider as RkProvider } from "reakit";

import { Mode } from "modes";
import { GlobalNav } from "components";

import styles from "./AppFrame.module.scss";
import { AppContext } from "./AppContext";
import { useViewport } from "hooks";

type Props = {
    children: React.ReactNode;
    containerClassName?: string;
    controls?: React.ReactNode;
    mode?: Mode;
};

const AppFrame = (props: Props) => {
    const { controls = null, children, containerClassName } = props;
    const controlsRef = useRef<null | HTMLDivElement>(null);
    const globalNavRef = useRef<null | HTMLDivElement>(null);
    const { viewportWidth } = useViewport();
    const isMobile = !!(viewportWidth && viewportWidth <= 700);
    const stationPickerDiscloseBelowElement = (isMobile ? globalNavRef : controlsRef).current;
    return (
        <RkProvider>
            <AppContext.Provider value={{ stationPickerDiscloseBelowElement, isMobile }}>
                <div className={styles.appFrame}>
                    <Head>
                        <meta
                            name="viewport"
                            content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
                        />
                        <title>Regional Rail Explorer</title>
                    </Head>
                    <GlobalNav ref={globalNavRef} />
                    {controls && (
                        <div className={styles.controls} ref={controlsRef}>
                            {controls}
                        </div>
                    )}
                    <div className={classNames(styles.container, containerClassName)}>
                        {children}
                    </div>
                </div>
            </AppContext.Provider>
        </RkProvider>
    );
};

export default AppFrame;
