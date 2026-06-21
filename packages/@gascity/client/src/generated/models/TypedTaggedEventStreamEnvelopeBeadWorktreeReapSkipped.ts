/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BeadWorktreeReapSkippedPayload } from './BeadWorktreeReapSkippedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeBeadWorktreeReapSkipped = {
    actor: string;
    city: string;
    message?: string;
    payload: BeadWorktreeReapSkippedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'bead.worktree.reap_skipped';
    workflow?: WorkflowEventProjection;
};

