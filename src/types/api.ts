import { JourneyInfo } from "./journey";
import { ScenarioInfo } from "./scenario";

export type ApiError<P = any> = { error: true; payload: P };
export type ApiResult<T, P> = ApiError<P> | T;

export type JourneyApiResult = ApiResult<JourneyInfo, { scenario: ScenarioInfo }>[];
