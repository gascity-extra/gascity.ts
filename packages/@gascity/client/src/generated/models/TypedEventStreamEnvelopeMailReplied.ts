/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MailEventPayload } from './MailEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeMailReplied = {
    actor: string;
    message?: string;
    payload: MailEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'mail.replied';
    workflow?: WorkflowEventProjection;
};

