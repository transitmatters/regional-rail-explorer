import { useContext } from "react";

import { AppContext } from "components";

export const useAppContext = () => {
    return useContext(AppContext);
};
