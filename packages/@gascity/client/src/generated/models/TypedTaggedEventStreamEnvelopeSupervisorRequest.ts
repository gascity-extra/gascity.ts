/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SupervisorRequestPayload } from './SupervisorRequestPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeSupervisorRequest = {
    actor: string;
    city: string;
    message?: string;
    payload: SupervisorRequestPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'supervisor.request';
    workflow?: WorkflowEventProjection;
};

