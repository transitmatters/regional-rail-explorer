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
    { title: "Read the Reports", href: "http://regionalrail.net", key: "reports" },
    {
        title: "Source Code",
        href: "https://github.com/transitmatters/regional-rail-explorer/",
        key: "source",
    },
    {
        title: "Send Feedback",
        href:
            "mailto:labs@transitmatters.org?subject=[Regional%20Rail%20Explorer%20Feedback]%20-%20",
        key: "feedback",
    },
];

const renderNavLink = (link: NavLink, router: NextRouter) => {
    if ("href" in link) {
        return (
            <a className={styles.link} href={link.href} target="_blank" key={link.key}>
                {link.title}
                <FiArrowUpRight className={styles.linkIcon} size={18} />
            </a>
        );
    }
    const isActive = "pathname" in link && link.pathname === router.pathname;
    return (
        <Link href={{ pathname: link.pathname }} key={link.key}>
            <a className={classNames(styles.link, isActive && styles.active)}>{link.title}</a>
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
