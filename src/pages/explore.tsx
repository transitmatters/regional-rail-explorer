import { Explorer } from "components";
import { JourneyInfo, NetworkTime, ParsedJourneyParams } from "types";
import { getJourneyParamsForQuery, getJourneys } from "server/journey";
import { getArrivalTimes } from "server/navigation/arrivals";

type Props = {
    journeyParams: ParsedJourneyParams;
    journeys: null | JourneyInfo[];
    arrivals: null | NetworkTime[][];
};

export default function Explore(props: Props) {
    return <Explorer {...props} />;
}

const getArrivalTimesForParams = (params: ParsedJourneyParams) => {
    const { fromStationId, toStationId, day } = params;
    if (fromStationId && toStationId && day) {
        return getArrivalTimes({ fromStationId, toStationId, day });
    }
    return null;
};

const getJourneysForParams = (params: ParsedJourneyParams) => {
    const { fromStationId, toStationId, day, time, reverse } = params;
    if (fromStationId && toStationId && day && time) {
        const journeyResults = getJourneys({ fromStationId, toStationId, day, time, reverse });
        const hasAnyError = journeyResults.some((result) => result.navigationFailed);
        if (hasAnyError) {
            return null;
        }
        return journeyResults as JourneyInfo[];
    }
    return null;
};

export const getServerSideProps = async ({ query }) => {
    const journeyParams = getJourneyParamsForQuery(query);
    const arrivals = getArrivalTimesForParams(journeyParams);
    const journeys = getJourneysForParams(journeyParams);
    return { props: { journeys, arrivals, journeyParams } };
};
