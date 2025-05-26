import React from "react";
import Image from "next/image";
import EeConceptLogo from "./ee-concept-logo-simpler.svg";
import styles from "./GlobalNav.module.scss";

export const logo = (
    <Image src={EeConceptLogo} alt="Expansion Explorer Logo" className={styles.logo} />
);
