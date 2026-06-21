/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
export type ExtMsgUnbindInputBody = {
    /**
     * Configured agent identity to unbind.
     */
    agent_name?: string;
    /**
     * Conversation to unbind (nil = filter by session_id/agent_name).
     */
    conversation?: ConversationRef;
    /**
     * Session ID to unbind.
     */
    session_id?: string;
};

