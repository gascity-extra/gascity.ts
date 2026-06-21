/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginationInfo } from './PaginationInfo';
export type SessionStreamMessageEvent = {
    format: string;
    id: string;
    pagination?: PaginationInfo;
    /**
     * Producing provider identifier (claude, codex, gemini, open-code, etc.).
     */
    provider: string;
    template: string;
    turns: any[] | null;
};

