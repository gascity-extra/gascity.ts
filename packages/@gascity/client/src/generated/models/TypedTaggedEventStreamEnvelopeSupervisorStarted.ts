/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SupervisorStartedPayload } from './SupervisorStartedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeSupervisorStarted = {
    actor: string;
    city: string;
    message?: string;
    payload: SupervisorStartedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'supervisor.started';
    workflow?: WorkflowEventProjection;
};

