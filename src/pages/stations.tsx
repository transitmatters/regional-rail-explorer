import { useState } from "react";

import { AppFrame, StationListing, StationSearchBar } from "components";
import { stationsByLine } from "stations";

export default function Stations() {
    const [searchTerm, setSearchTerm] = useState("");
    return (
        <AppFrame
            mode="stations"
            controls={
                <StationSearchBar
                    onChange={setSearchTerm}
                    value={searchTerm}
                    ref={(e) => e?.focus()}
                />
            }
        >
            <StationListing
                stationsByLine={stationsByLine}
                showSearch={false}
                searchTerm={searchTerm}
            />
        </AppFrame>
    );
}
