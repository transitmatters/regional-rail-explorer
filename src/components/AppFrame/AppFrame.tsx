import React from "react";
import classNames from "classnames";
import Head from "next/head";

import { Mode } from "modes";
import { GlobalNav } from "components";
import { useAppContext } from "hooks";

import styles from "./AppFrame.module.scss";

type Props = {
    children: React.ReactNode;
    containerClassName?: string;
    controls?: React.ReactNode;
    mode?: Mode;
    meta?: React.ReactNode;
};

export const AppFrame: React.FunctionComponent<Props> = (props) => {
    const { controls = null, meta = null, children, containerClassName } = props;
    const { globalNavRef, controlsRef } = useAppContext();
    return (
        <div className={styles.appFrame}>
            <Head>{meta}</Head>
            <GlobalNav ref={globalNavRef} />
            {controls && (
                <div className={styles.controls} ref={controlsRef}>
                    {controls}
                </div>
            )}
            <div className={classNames(styles.container, containerClassName)}>{children}</div>
        </div>
    );
};
