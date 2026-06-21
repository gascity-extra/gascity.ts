/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
export type ExtMsgBindInputBody = {
    /**
     * Configured agent identity to bind; its live session is resolved at delivery time, cold-waking one when none is live (mutually exclusive with session_id).
     */
    agent_name?: string;
    /**
     * Conversation to bind.
     */
    conversation?: ConversationRef;
    /**
     * Optional binding metadata.
     */
    metadata?: Record<string, string>;
    /**
     * Session ID to bind (mutually exclusive with agent_name).
     */
    session_id?: string;
};

