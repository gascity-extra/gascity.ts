/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalInboundMessage } from './ExternalInboundMessage';
export type ExtMsgInboundInputBody = {
    /**
     * Account ID for raw payloads (required when message is absent).
     */
    account_id?: string;
    /**
     * Pre-normalized inbound message.
     */
    message?: ExternalInboundMessage;
    /**
     * Raw payload bytes.
     */
    payload?: string;
    /**
     * Provider name for raw payloads (required when message is absent).
     */
    provider?: string;
};

