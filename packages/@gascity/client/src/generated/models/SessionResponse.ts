/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubmissionCapabilities } from './SubmissionCapabilities';
export type SessionResponse = {
    active_bead?: string;
    activity?: string;
    agent_kind?: string;
    alias?: string;
    attached: boolean;
    configured_named_session?: boolean;
    context_pct?: number;
    context_window?: number;
    created_at: string;
    display_name?: string;
    id: string;
    kind?: string;
    last_active?: string;
    last_nudge_delivered_at?: string;
    last_output?: string;
    metadata?: Record<string, string>;
    model?: string;
    options?: Record<string, string>;
    pool?: string;
    provider: string;
    reason?: string;
    rig?: string;
    running: boolean;
    session_name: string;
    state: string;
    submission_capabilities?: SubmissionCapabilities;
    template: string;
    title: string;
};

