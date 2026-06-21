/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
export type ExtMsgOutboundInputBody = {
    /**
     * Target conversation.
     */
    conversation?: ConversationRef;
    /**
     * Idempotency key.
     */
    idempotency_key?: string;
    /**
     * Message ID to reply to.
     */
    reply_to_message_id?: string;
    /**
     * Session ID.
     */
    session_id: string;
    /**
     * Message text.
     */
    text?: string;
};

