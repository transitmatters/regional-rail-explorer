import Head from "next/head";
import { mapScenarios } from "server/scenarios";

interface Props {
    routeInfo: any;
}

export async function getServerSideProps(context) {
    const {
        params: { id },
    } = context;
    const routeInfo = mapScenarios(
        ["phase_one"],
        (scenario) => scenario.network.regionalRailRouteInfo[id]
    );
    return {
        props: {
            routeInfo,
        },
    };
}

export default function Route(props: Props) {
    return (
        <div>
            <Head>
                <title>Regional Rail Explorer</title>
            </Head>
            {JSON.stringify(props.routeInfo)}
        </div>
    );
}
