/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
import type { FanoutPolicy } from './FanoutPolicy';
export type ConversationGroupRecord = {
    DefaultHandle: string;
    FanoutPolicy: FanoutPolicy;
    ID: string;
    LastAddressedHandle: string;
    Metadata: Record<string, string>;
    Mode: string;
    RootConversation: ConversationRef;
    SchemaVersion: number;
};

