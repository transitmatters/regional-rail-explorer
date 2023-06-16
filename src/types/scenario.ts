import { Network } from "./model";

export const scenarioIds = ["present", "regional_rail"] as const;
export type ScenarioId = (typeof scenarioIds)[number];

export interface ScenarioInfo {
    id: ScenarioId;
    name: string;
}

export interface Scenario extends ScenarioInfo {
    unifiedFares: boolean;
    network: Network;
}
