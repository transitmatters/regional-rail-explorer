import { AppFrame } from "components";
import { mapScenarios } from "server/scenarios";
import { getStationInfo } from "server/network/stations";
import StationDetails, { StationScenarioInfo } from "components/StationDetails/StationDetails";

interface Props {
    stationScenarioInfo: StationScenarioInfo[];
}

export async function getServerSideProps(context) {
    const {
        params: { id },
    } = context;
    const stationScenarioInfo = mapScenarios(
        (scenario) => {
            return {
                scenario: {
                    name: scenario.name,
                    id: scenario.id,
                },
                station: getStationInfo(scenario.network.stationsById[id]),
            };
        },
        () => null
    );
    return {
        props: {
            stationScenarioInfo,
        },
    };
}

export default function Route(props: Props) {
    const { stationScenarioInfo } = props;
    return (
        <AppFrame mode="stations">
            <StationDetails stationScenarioInfo={stationScenarioInfo} />
        </AppFrame>
    );
}
