/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CityUnregisterSucceededPayload } from './CityUnregisterSucceededPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedTaggedEventStreamEnvelopeRequestResultCityUnregister = {
    actor: string;
    city: string;
    message?: string;
    payload: CityUnregisterSucceededPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'request.result.city.unregister';
    workflow?: WorkflowEventProjection;
};

