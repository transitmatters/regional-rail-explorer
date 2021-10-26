import React from "react";
import classNames from "classnames";
import { NextRouter, useRouter } from "next/router";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

import { logo } from "./logo";

import styles from "./GlobalNav.module.scss";

type NavLink = {
    title: string;
    key: string;
} & ({ pathname: string } | { href: string });

const navLinks: NavLink[] = [
    { title: "Plan a trip", pathname: "/explore", key: "trip" },
    { title: "Read the Reports", href: "//regionalrail.net", key: "reports" },
];

const renderNavLink = (link: NavLink, router: NextRouter) => {
    const href = "pathname" in link ? { pathname: link.pathname } : link.href;
    const isActive = "pathname" in link && link.pathname === router.pathname;
    const isExternal = "href" in link;
    return (
        <Link href={href} passHref={isExternal} key={link.key}>
            <a
                className={classNames(styles.link, isActive && styles.active)}
                target={isExternal ? "_blank" : undefined}
            >
                {link.title}
                {isExternal && <FiArrowUpRight className={styles.linkIcon} size={18} />}
            </a>
        </Link>
    );
};

const GlobalNav = React.forwardRef((_, ref: React.Ref<HTMLDivElement>) => {
    const router = useRouter();
    return (
        <div className={styles.globalNav} ref={ref}>
            <Link href="/">
                <div className={styles.logoContainer}>
                    {logo}
                    <div className={styles.text}>
                        <div className={styles.top}>Regional Rail</div>
                        <div className={styles.bottom}>Explorer</div>
                    </div>
                </div>
            </Link>
            <div className={styles.links}>
                {navLinks.map((link) => renderNavLink(link, router))}
            </div>
            <a className={styles.rightElement} href="//transitmatters.org" target="_blank">
                <img className={styles.tmLogo} src="/tm-logo.svg" />
            </a>
        </div>
    );
});

export default GlobalNav;
