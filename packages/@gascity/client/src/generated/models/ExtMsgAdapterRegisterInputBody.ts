/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdapterCapabilities } from './AdapterCapabilities';
export type ExtMsgAdapterRegisterInputBody = {
    /**
     * Account ID.
     */
    account_id: string;
    /**
     * Callback URL for outbound messages.
     */
    callback_url?: string;
    /**
     * Adapter capabilities.
     */
    capabilities?: AdapterCapabilities;
    /**
     * Adapter display name.
     */
    name?: string;
    /**
     * Provider name.
     */
    provider: string;
};

