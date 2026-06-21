/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OutboundEventPayload } from './OutboundEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeExtmsgOutbound = {
    actor: string;
    message?: string;
    payload: OutboundEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'extmsg.outbound';
    workflow?: WorkflowEventProjection;
};

