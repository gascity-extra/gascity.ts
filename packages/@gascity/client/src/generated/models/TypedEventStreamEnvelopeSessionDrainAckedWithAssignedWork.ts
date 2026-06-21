/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionDrainAckedWithAssignedWorkPayload } from './SessionDrainAckedWithAssignedWorkPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeSessionDrainAckedWithAssignedWork = {
    actor: string;
    message?: string;
    payload: SessionDrainAckedWithAssignedWorkPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'session.drain_acked_with_assigned_work';
    workflow?: WorkflowEventProjection;
};

