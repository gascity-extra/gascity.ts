/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BeadClaimRejectedPayload } from './BeadClaimRejectedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeBeadClaimRejected = {
    actor: string;
    city: string;
    message?: string;
    payload: BeadClaimRejectedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'bead.claim_rejected';
    workflow?: WorkflowEventProjection;
};

