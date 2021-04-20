import React from "react";
import classNames from "classnames";
import Head from "next/head";
import { HiHome, HiChevronRight } from "react-icons/hi";

import { ModeSelect } from "components";
import { Mode } from "modes";

import styles from "./AppFrame.module.scss";

type Props = {
    breadcrumbs?: React.ReactNode[];
    children: React.ReactNode;
    containerClassName?: string;
    controls?: React.ReactNode;
    mode?: Mode;
};

const AppFrame = (props: Props) => {
    const {
        controls = null,
        breadcrumbs: providedBreadcrumbs = [],
        mode,
        children,
        containerClassName,
    } = props;

    const breadcrumbs = [
        <a href="/" key={0}>
            <HiHome size={20} />
        </a>,
        mode && <ModeSelect mode={mode} />,
        ...providedBreadcrumbs,
    ].filter((x) => x);

    return (
        <div className={styles.appFrame}>
            <Head>
                <title>Regional Rail Explorer</title>
            </Head>
            <div className={styles.globalNav}>
                <div className={styles.breadcrumbs}>
                    {breadcrumbs.map((breadcrumb, index) => (
                        <div className={styles.breadcrumb} key={index}>
                            <span>{breadcrumb}</span>
                            <HiChevronRight size={24} />
                        </div>
                    ))}
                </div>
                {controls}
            </div>
            <div className={classNames(styles.container, containerClassName)}>{children}</div>
        </div>
    );
};

export default AppFrame;
