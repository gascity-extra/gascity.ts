/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SupervisorShutdownPayload } from './SupervisorShutdownPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeSupervisorShutdownRequested = {
    actor: string;
    message?: string;
    payload: SupervisorShutdownPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'supervisor.shutdown_requested';
    workflow?: WorkflowEventProjection;
};

