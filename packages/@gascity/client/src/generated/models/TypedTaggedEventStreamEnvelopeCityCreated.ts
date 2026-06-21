/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CityLifecyclePayload } from './CityLifecyclePayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeCityCreated = {
    actor: string;
    city: string;
    message?: string;
    payload: CityLifecyclePayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'city.created';
    workflow?: WorkflowEventProjection;
};

