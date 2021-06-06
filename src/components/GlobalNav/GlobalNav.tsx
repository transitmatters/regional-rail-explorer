import React from "react";
import classNames from "classnames";
import { NextRouter, useRouter } from "next/router";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

import { logo } from "./logo";

import styles from "./GlobalNav.module.scss";

type NavLink = {
    title: string;
} & ({ pathname: string } | { href: string });

const navLinks: NavLink[] = [
    { title: "Plan a trip", pathname: "/" },
    { title: "Read the Reports", href: "//regionalrail.net" },
];

const renderNavLink = (link: NavLink, router: NextRouter) => {
    const href = "pathname" in link ? { pathname: link.pathname } : link.href;
    const isActive = "pathname" in link && link.pathname === router.pathname;
    const showExternalIcon = "href" in link;
    return (
        <Link href={href} passHref={"href" in link}>
            <a className={classNames(styles.link, isActive && styles.active)}>
                {link.title}
                {showExternalIcon && <FiArrowUpRight className={styles.linkIcon} size={18} />}
            </a>
        </Link>
    );
};

const GlobalNav = () => {
    const router = useRouter();
    return (
        <div className={styles.globalNav}>
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
            <img className={styles.tmLogo} src="/tm-logo.svg" />
        </div>
    );
};

export default GlobalNav;
