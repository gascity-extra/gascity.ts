/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RequestFailedPayload = {
    /**
     * Machine-readable error code.
     */
    error_code: string;
    /**
     * Human-readable error description.
     */
    error_message: string;
    /**
     * Which operation failed.
     */
    operation: RequestFailedPayload.operation;
    /**
     * Correlation ID from the 202 response.
     */
    request_id: string;
};
export namespace RequestFailedPayload {
    /**
     * Which operation failed.
     */
    export enum operation {
        CITY_CREATE = 'city.create',
        CITY_UNREGISTER = 'city.unregister',
        SESSION_CREATE = 'session.create',
        SESSION_MESSAGE = 'session.message',
        SESSION_SUBMIT = 'session.submit',
    }
}

