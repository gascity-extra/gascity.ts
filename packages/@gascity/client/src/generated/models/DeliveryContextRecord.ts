/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
export type DeliveryContextRecord = {
    BindingGeneration: number;
    Conversation: ConversationRef;
    ID: string;
    LastMessageID: string;
    LastPublishedAt: string;
    Metadata: Record<string, string>;
    SchemaVersion: number;
    SessionID: string;
    SourceSessionID: string;
};

