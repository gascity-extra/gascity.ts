/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PostgresCredentialResolvedPayload } from './PostgresCredentialResolvedPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopePgCredentialResolved = {
    actor: string;
    city: string;
    message?: string;
    payload: PostgresCredentialResolvedPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'pg.credential_resolved';
    workflow?: WorkflowEventProjection;
};

