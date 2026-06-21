/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GitStatus } from './GitStatus';
export type RigResponse = {
    agent_count: number;
    default_branch?: string;
    git?: GitStatus;
    last_activity?: string;
    name: string;
    path: string;
    prefix?: string;
    running_count: number;
    suspended: boolean;
};

