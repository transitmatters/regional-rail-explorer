import React from "react";

import styles from "./GlobalNav.module.scss";

const logo = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 217.2 135.2" className={styles.logo}>
        <path d="M94 135H57V0h92q14 0 25 3t16 9a32 32 0 0110 13 51 51 0 013 18 42 42 0 01-3 15 35 35 0 01-6 11 39 39 0 01-10 8 64 64 0 01-11 5l44 53h-43l-40-50H94zm72-92a19 19 0 00-1-7 9 9 0 00-4-4 18 18 0 00-7-3 61 61 0 00-10-1H94v29h50a60 60 0 0010-1 18 18 0 007-2 9 9 0 004-5 19 19 0 001-6z" />
        <path d="M66 135H30V0h91q15 0 25 3a44 44 0 0117 9 33 33 0 019 13 51 51 0 013 18 42 42 0 01-2 15 35 35 0 01-7 11 39 39 0 01-9 8 64 64 0 01-12 5l45 53h-43l-41-50H66zm72-92a19 19 0 00-1-7 9 9 0 00-3-4 18 18 0 00-7-3 61 61 0 00-11-1H66v29h50a60 60 0 0011-1 18 18 0 007-2 9 9 0 003-5 19 19 0 001-6z" />
        <path d="M37 135H0V0h92q14 0 25 3t16 9a32 32 0 0110 13 51 51 0 013 18 42 42 0 01-3 15 35 35 0 01-6 11 39 39 0 01-10 8 64 64 0 01-11 5l44 53h-43L76 85H37zm72-92a19 19 0 00-1-7 9 9 0 00-4-4 18 18 0 00-7-3 61 61 0 00-10-1H37v29h50a60 60 0 0010-1 18 18 0 007-2 9 9 0 004-5 19 19 0 001-6z" />
    </svg>
);

const GlobalNav = () => {
    return (
        <div className={styles.globalNav}>
            <div className={styles.logoContainer}>
                {logo}
                <div className={styles.text}>
                    <div className={styles.title}>Regional Rail Explorer???</div>
                </div>
            </div>
        </div>
    );
};

export default GlobalNav;
