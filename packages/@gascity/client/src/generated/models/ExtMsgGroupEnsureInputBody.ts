/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
export type ExtMsgGroupEnsureInputBody = {
    /**
     * Default handle for the group.
     */
    default_handle?: string;
    /**
     * Group metadata.
     */
    metadata?: Record<string, string>;
    /**
     * Group mode (launcher, etc.).
     */
    mode?: string;
    /**
     * Root conversation reference.
     */
    root_conversation?: ConversationRef;
};

