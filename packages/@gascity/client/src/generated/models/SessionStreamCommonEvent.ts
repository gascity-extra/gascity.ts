/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HeartbeatEvent } from './HeartbeatEvent';
import type { PendingInteraction } from './PendingInteraction';
import type { SessionActivityEvent } from './SessionActivityEvent';
/**
 * Non-message events emitted on the session SSE stream: activity transitions, pending interactions, and keepalive heartbeats. The concrete variant is identified by the SSE event name.
 */
export type SessionStreamCommonEvent = (SessionActivityEvent | PendingInteraction | HeartbeatEvent);

