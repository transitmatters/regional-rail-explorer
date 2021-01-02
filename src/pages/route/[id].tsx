import { RouteVisualizer } from "components";
import LiveRouteVisualizer from "components/RouteVisualizer/LiveRouteVisualizer";
import Head from "next/head";

import { mapScenarios } from "server/scenarios";
import { SerializableRouteInfo } from "types";

interface Props {
    scenarios: string[];
    routeInfo: SerializableRouteInfo[];
}

export async function getServerSideProps(context) {
    const {
        params: { id },
    } = context;
    const scenarios = ["phase_one"];
    const routeInfo = mapScenarios(
        scenarios,
        (scenario) => scenario.network.regionalRailRouteInfo[id]
    );
    return {
        props: {
            routeInfo,
            scenarios,
        },
    };
}

export default function Route(props: Props) {
    const { routeInfo } = props;
    const [phaseOneRouteInfo] = routeInfo;
    const { weekdayTrips, stationNames, branchMap } = phaseOneRouteInfo;
    return (
        <div>
            <Head>
                <title>Regional Rail Explorer</title>
            </Head>
            <LiveRouteVisualizer
                trips={weekdayTrips}
                stationNames={stationNames}
                branchMap={branchMap}
            />
        </div>
    );
}
