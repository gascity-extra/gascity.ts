/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdapterEventPayload } from './AdapterEventPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeExtmsgAdapterRemoved = {
    actor: string;
    city: string;
    message?: string;
    payload: AdapterEventPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'extmsg.adapter_removed';
    workflow?: WorkflowEventProjection;
};

