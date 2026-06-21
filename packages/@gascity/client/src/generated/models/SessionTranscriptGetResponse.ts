/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginationInfo } from './PaginationInfo';
export type SessionTranscriptGetResponse = {
    /**
     * conversation, text, or raw.
     */
    format: string;
    id: string;
    /**
     * Populated for raw format; provider-native frames emitted verbatim as the provider wrote them.
     */
    messages?: any[] | null;
    pagination?: PaginationInfo;
    /**
     * Producing provider identifier (claude, codex, gemini, open-code, etc.). Consumers use this to dispatch per-provider frame parsing.
     */
    provider: string;
    template: string;
    /**
     * Populated for conversation/text formats.
     */
    turns?: any[] | null;
};

