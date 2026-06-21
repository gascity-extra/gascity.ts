/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NoPayload } from './NoPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeControllerStopped = {
    actor: string;
    message?: string;
    payload: NoPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'controller.stopped';
    workflow?: WorkflowEventProjection;
};

