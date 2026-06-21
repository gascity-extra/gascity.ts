/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeCustom = {
    actor: string;
    city: string;
    message?: string;
    payload: any;
    seq: number;
    subject?: string;
    ts: string;
    type: 'TypedTaggedEventStreamEnvelopeCustom';
    workflow?: WorkflowEventProjection;
};

