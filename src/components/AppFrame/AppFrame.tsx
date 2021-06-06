import React, { useRef } from "react";
import classNames from "classnames";
import Head from "next/head";

import { Mode } from "modes";
import { GlobalNav } from "components";

import styles from "./AppFrame.module.scss";
import { AppFrameContext } from "./AppFrameContext";

type Props = {
    children: React.ReactNode;
    containerClassName?: string;
    controls?: React.ReactNode;
    mode?: Mode;
};

const AppFrame = (props: Props) => {
    const { controls = null, children, containerClassName } = props;
    const controlsRef = useRef<null | HTMLDivElement>(null);

    return (
        <AppFrameContext.Provider value={{ controlsContainer: controlsRef.current }}>
            <div className={styles.appFrame}>
                <Head>
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
                    />
                    <title>Regional Rail Explorer</title>
                </Head>
                <GlobalNav />
                {controls && (
                    <div className={styles.controls} ref={controlsRef}>
                        {controls}
                    </div>
                )}
                <div className={classNames(styles.container, containerClassName)}>{children}</div>
            </div>
        </AppFrameContext.Provider>
    );
};

export default AppFrame;
