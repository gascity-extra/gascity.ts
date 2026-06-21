/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
import type { ExternalActor } from './ExternalActor';
import type { TranscriptMessageKind } from './TranscriptMessageKind';
import type { TranscriptProvenance } from './TranscriptProvenance';
export type ConversationTranscriptRecord = {
    Actor: ExternalActor;
    Attachments: any[] | null;
    Conversation: ConversationRef;
    CreatedAt: string;
    ExplicitTarget: string;
    ID: string;
    Kind: TranscriptMessageKind;
    Metadata: Record<string, string>;
    Provenance: TranscriptProvenance;
    ProviderMessageID: string;
    ReplyToMessageID: string;
    SchemaVersion: number;
    Sequence: number;
    SourceSessionID: string;
    Text: string;
};

