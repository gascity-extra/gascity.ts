/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationTranscriptRecord } from './ConversationTranscriptRecord';
import type { ExternalInboundMessage } from './ExternalInboundMessage';
import type { GroupRouteDecision } from './GroupRouteDecision';
import type { SessionBindingRecord } from './SessionBindingRecord';
export type InboundResult = {
    Binding: SessionBindingRecord;
    GroupRoute: GroupRouteDecision;
    Message: ExternalInboundMessage;
    TargetAgentName: string;
    TargetSessionID: string;
    TranscriptEntry: ConversationTranscriptRecord;
};

