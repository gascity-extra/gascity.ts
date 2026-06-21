/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OutboundChannelMismatchPayload } from './OutboundChannelMismatchPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeExtmsgOutboundChannelMismatch = {
    actor: string;
    city: string;
    message?: string;
    payload: OutboundChannelMismatchPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'extmsg.outbound_channel_mismatch';
    workflow?: WorkflowEventProjection;
};

