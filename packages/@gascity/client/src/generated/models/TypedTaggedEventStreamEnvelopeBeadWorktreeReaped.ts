/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BeadWorktreeReapedPayload } from './BeadWorktreeReapedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeBeadWorktreeReaped = {
    actor: string;
    city: string;
    message?: string;
    payload: BeadWorktreeReapedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'bead.worktree.reaped';
    workflow?: WorkflowEventProjection;
};

