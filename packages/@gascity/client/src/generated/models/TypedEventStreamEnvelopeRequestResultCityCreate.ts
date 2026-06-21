/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CityCreateSucceededPayload } from './CityCreateSucceededPayload';
import type { WorkflowEventProjection } from './WorkflowEventProjection';
export type TypedEventStreamEnvelopeRequestResultCityCreate = {
    actor: string;
    message?: string;
    payload: CityCreateSucceededPayload;
    seq: number;
    subject?: string;
    ts: string;
    type: 'request.result.city.create';
    workflow?: WorkflowEventProjection;
};

