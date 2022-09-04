import { Explorer } from "components";
import { ArrivalsInfo, JourneyInfo, ParsedJourneyParams } from "types";
import { getJourneyParamsForQuery, getSuccessfulJourneys } from "server/journey";
import { getArrivalsInfo } from "server/navigation/arrivals";

type Props = {
    journeys: null | JourneyInfo[];
    arrivals: null | ArrivalsInfo;
};

export default function Explore(props: Props) {
    return <Explorer {...props} />;
}

const getArrivalsInfoForParams = (params: ParsedJourneyParams) => {
    const { fromStationId, toStationId, day } = params;
    if (fromStationId && toStationId && day) {
        return getArrivalsInfo({ fromStationId, toStationId, day });
    }
    return null;
};

const getJourneysForParams = (params: ParsedJourneyParams) => {
    const { fromStationId, toStationId, day, time, navigationKind } = params;
    if (fromStationId && toStationId && day && time && navigationKind) {
        return getSuccessfulJourneys({ fromStationId, toStationId, day, time, navigationKind });
    }
    return null;
};

export const getServerSideProps = async ({ query }) => {
    const journeyParams = getJourneyParamsForQuery(query);
    const arrivals = getArrivalsInfoForParams(journeyParams);
    const journeys = getJourneysForParams(journeyParams);
    return { props: { journeys, arrivals } };
};
