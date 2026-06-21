/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubmitIntent } from './SubmitIntent';
export type SessionSubmitInputBody = {
    /**
     * Submit intent; empty defaults to "default".
     */
    intent?: SubmitIntent;
    /**
     * Message text to submit.
     */
    message: string;
};

