/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionInfo } from './SessionInfo';
export type AgentResponse = {
    active_bead?: string;
    activity?: string;
    available: boolean;
    context_pct?: number;
    context_window?: number;
    description?: string;
    display_name?: string;
    last_output?: string;
    model?: string;
    name: string;
    pool?: string;
    provider?: string;
    rig?: string;
    running: boolean;
    session?: SessionInfo;
    state: string;
    suspended: boolean;
    unavailable_reason?: string;
};

