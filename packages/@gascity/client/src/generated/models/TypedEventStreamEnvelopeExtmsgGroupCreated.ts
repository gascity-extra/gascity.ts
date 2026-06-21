/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GroupCreatedEventPayload } from './GroupCreatedEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeExtmsgGroupCreated = {
    actor: string;
    message?: string;
    payload: GroupCreatedEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'extmsg.group_created';
    workflow?: WorkflowEventProjection;
};

