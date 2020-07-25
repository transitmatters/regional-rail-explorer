import * as React from "react";
import { storiesOf } from "@storybook/react";

import FrequencyHistogram from "./FrequencyHistogram";

storiesOf("FrequencyHistogram", module).add("default", () => {
  return <FrequencyHistogram />;
});
