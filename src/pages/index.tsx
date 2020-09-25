import Head from "next/head";

import styles from "./index.module.scss";
import Explorer from "components/Explorer/Explorer";

export default function Home() {
    return (
        <div className={styles.index}>
            <Head>
                <title>Regional Rail Explorer</title>
            </Head>
            <Explorer />
        </div>
    );
}