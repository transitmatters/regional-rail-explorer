import Head from "next/head";

import { Home } from "components";

// Link previews (Slack, social sites) for the home page. Journey pages set their own, pointing at
// that journey's summary card (components/Explorer/socialMeta.tsx).
const SOCIAL_IMAGE = "https://regionalrail.rocks/social-card.png";
const DESCRIPTION =
    "See how TransitMatters' plan for frequent, electrified Regional Rail would transform your commute.";

export default function Index() {
    return (
        <>
            <Head>
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://regionalrail.rocks/" />
                <meta property="og:title" content="TransitMatters | Regional Rail Explorer" />
                <meta property="og:description" content={DESCRIPTION} />
                <meta property="og:image" content={SOCIAL_IMAGE} />
                <meta property="og:image:width" content="1600" />
                <meta property="og:image:height" content="800" />
                <meta property="og:image:alt" content="Regional Rail Explorer by TransitMatters" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:creator" content="@transitmatters" />
                <meta name="twitter:image" content={SOCIAL_IMAGE} />
            </Head>
            <Home />
        </>
    );
}
