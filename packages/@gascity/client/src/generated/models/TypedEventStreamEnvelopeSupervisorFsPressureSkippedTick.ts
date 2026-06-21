/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SupervisorFSPressureSkippedTickPayload } from './SupervisorFSPressureSkippedTickPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeSupervisorFsPressureSkippedTick = {
    actor: string;
    message?: string;
    payload: SupervisorFSPressureSkippedTickPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'supervisor.fs_pressure.skipped_tick';
    workflow?: WorkflowEventProjection;
};

