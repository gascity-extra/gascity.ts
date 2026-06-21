/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
export type ExtMsgTranscriptAckInputBody = {
    /**
     * Conversation to acknowledge.
     */
    conversation?: ConversationRef;
    /**
     * Sequence number to acknowledge up to.
     */
    sequence?: number;
    /**
     * Session ID.
     */
    session_id: string;
};

