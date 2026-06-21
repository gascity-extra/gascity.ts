/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowAttemptSummary } from './WorkflowAttemptSummary';
import type { WorkflowBeadResponse } from './WorkflowBeadResponse';
export type WorkflowEventProjection = {
    attempt_summary?: WorkflowAttemptSummary;
    bead: WorkflowBeadResponse;
    changed_fields: any[] | null;
    event_seq: number;
    event_ts: string;
    event_type: string;
    logical_node_id: string;
    requires_resync?: boolean;
    root_bead_id: string;
    root_store_ref: string;
    scope_kind: string;
    scope_ref: string;
    type: string;
    watch_generation: string;
    workflow_id: string;
    workflow_seq: number;
};

