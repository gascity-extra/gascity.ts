/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationTranscriptRecord } from './ConversationTranscriptRecord';
import type { DeliveryContextRecord } from './DeliveryContextRecord';
import type { PublishReceipt } from './PublishReceipt';
export type OutboundResult = {
    DeliveryContext: DeliveryContextRecord;
    Receipt: PublishReceipt;
    TranscriptEntry: ConversationTranscriptRecord;
};

