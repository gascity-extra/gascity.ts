/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BindingStatus } from './BindingStatus';
import type { ConversationRef } from './ConversationRef';
export type SessionBindingRecord = {
    AgentName: string;
    BindingGeneration: number;
    BoundAt: string;
    Conversation: ConversationRef;
    ExpiresAt: string | null;
    ID: string;
    Metadata: Record<string, string>;
    SchemaVersion: number;
    SessionID: string;
    SessionName: string;
    Status: BindingStatus;
};

