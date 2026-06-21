/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkerOperationEventPayload } from './WorkerOperationEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeWorkerOperation = {
    actor: string;
    message?: string;
    payload: WorkerOperationEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'worker.operation';
    workflow?: WorkflowEventProjection;
};

