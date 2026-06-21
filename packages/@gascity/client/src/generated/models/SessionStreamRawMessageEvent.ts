/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginationInfo } from './PaginationInfo';
export type SessionStreamRawMessageEvent = {
    format: string;
    id: string;
    /**
     * Provider-native transcript frames, emitted verbatim as the provider wrote them.
     */
    messages: any[] | null;
    pagination?: PaginationInfo;
    /**
     * Producing provider identifier (claude, codex, gemini, open-code, etc.). Consumers use this to dispatch per-provider frame parsing.
     */
    provider: string;
    template: string;
};

