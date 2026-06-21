/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SessionResponse } from './SessionResponse';
export type SessionCreateSucceededPayload = {
    /**
     * Correlation ID from the 202 response.
     */
    request_id: string;
    /**
     * Full session state as returned by GET /session/{id}. For session.create, this result is emitted only after the session has left creating and can accept normal metadata and lifecycle commands.
     */
    session: SessionResponse;
};

