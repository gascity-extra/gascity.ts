/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationRef } from './ConversationRef';
import type { ExternalActor } from './ExternalActor';
export type ExternalInboundMessage = {
    actor: ExternalActor;
    attachments?: any[] | null;
    conversation: ConversationRef;
    dedup_key?: string;
    explicit_target?: string;
    provider_message_id: string;
    received_at: string;
    reply_to_message_id?: string;
    text: string;
};

