/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProjectIdentityStampedPayload } from './ProjectIdentityStampedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeProjectIdentityStamped = {
    actor: string;
    message?: string;
    payload: ProjectIdentityStampedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'project.identity.stamped';
    workflow?: WorkflowEventProjection;
};

