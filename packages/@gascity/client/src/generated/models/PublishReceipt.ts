/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
export type PublishReceipt = {
    Conversation: ConversationRef;
    Delivered: boolean;
    FailureKind: string;
    MessageID: string;
    Metadata: Record<string, string>;
    RetryAfter: number;
};

