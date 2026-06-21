/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentCreatedOutputBody } from '../models/AgentCreatedOutputBody';
import type { AgentCreateInputBody } from '../models/AgentCreateInputBody';
import type { AgentOutputResponse } from '../models/AgentOutputResponse';
import type { AgentPatch } from '../models/AgentPatch';
import type { AgentPatchSetInputBody } from '../models/AgentPatchSetInputBody';
import type { AgentResponse } from '../models/AgentResponse';
import type { AgentUpdateInputBody } from '../models/AgentUpdateInputBody';
import type { AgentUpdateQualifiedInputBody } from '../models/AgentUpdateQualifiedInputBody';
import type { AsyncAcceptedBody } from '../models/AsyncAcceptedBody';
import type { AsyncAcceptedResponse } from '../models/AsyncAcceptedResponse';
import type { Bead } from '../models/Bead';
import type { BeadAssignInputBody } from '../models/BeadAssignInputBody';
import type { BeadCreateInputBody } from '../models/BeadCreateInputBody';
import type { BeadDepsResponse } from '../models/BeadDepsResponse';
import type { BeadGraphResponse } from '../models/BeadGraphResponse';
import type { BeadUpdateBody } from '../models/BeadUpdateBody';
import type { CityCreateRequest } from '../models/CityCreateRequest';
import type { CityGetResponse } from '../models/CityGetResponse';
import type { CityPatchInputBody } from '../models/CityPatchInputBody';
import type { ConfigExplainResponse } from '../models/ConfigExplainResponse';
import type { ConfigResponse } from '../models/ConfigResponse';
import type { ConfigValidateOutputBody } from '../models/ConfigValidateOutputBody';
import type { ConversationGroupParticipant } from '../models/ConversationGroupParticipant';
import type { ConversationGroupRecord } from '../models/ConversationGroupRecord';
import type { ConvoyAddInputBody } from '../models/ConvoyAddInputBody';
import type { ConvoyCheckResponse } from '../models/ConvoyCheckResponse';
import type { ConvoyCreateInputBody } from '../models/ConvoyCreateInputBody';
import type { ConvoyGetResponse } from '../models/ConvoyGetResponse';
import type { ConvoyRemoveInputBody } from '../models/ConvoyRemoveInputBody';
import type { ErrorModel } from '../models/ErrorModel';
import type { EventEmitOutputBody } from '../models/EventEmitOutputBody';
import type { EventEmitRequest } from '../models/EventEmitRequest';
import type { EventRotateResponse } from '../models/EventRotateResponse';
import type { ExtMsgAdapterRegisterInputBody } from '../models/ExtMsgAdapterRegisterInputBody';
import type { ExtMsgAdapterRegisterOutputBody } from '../models/ExtMsgAdapterRegisterOutputBody';
import type { ExtMsgAdapterUnregisterInputBody } from '../models/ExtMsgAdapterUnregisterInputBody';
import type { ExtMsgBindInputBody } from '../models/ExtMsgBindInputBody';
import type { ExtMsgGroupEnsureInputBody } from '../models/ExtMsgGroupEnsureInputBody';
import type { ExtMsgInboundInputBody } from '../models/ExtMsgInboundInputBody';
import type { ExtMsgOutboundInputBody } from '../models/ExtMsgOutboundInputBody';
import type { ExtMsgParticipantRemoveInputBody } from '../models/ExtMsgParticipantRemoveInputBody';
import type { ExtMsgParticipantUpsertInputBody } from '../models/ExtMsgParticipantUpsertInputBody';
import type { ExtMsgTranscriptAckInputBody } from '../models/ExtMsgTranscriptAckInputBody';
import type { ExtMsgUnbindBody } from '../models/ExtMsgUnbindBody';
import type { ExtMsgUnbindInputBody } from '../models/ExtMsgUnbindInputBody';
import type { FormulaDetailResponse } from '../models/FormulaDetailResponse';
import type { FormulaFeedBody } from '../models/FormulaFeedBody';
import type { FormulaListBody } from '../models/FormulaListBody';
import type { FormulaPreviewBody } from '../models/FormulaPreviewBody';
import type { FormulaRunsResponse } from '../models/FormulaRunsResponse';
import type { HealthOutputBody } from '../models/HealthOutputBody';
import type { HeartbeatEvent } from '../models/HeartbeatEvent';
import type { InboundResult } from '../models/InboundResult';
import type { ListBodyAgentPatch } from '../models/ListBodyAgentPatch';
import type { ListBodyAgentResponse } from '../models/ListBodyAgentResponse';
import type { ListBodyBead } from '../models/ListBodyBead';
import type { ListBodyCityPendingEntry } from '../models/ListBodyCityPendingEntry';
import type { ListBodyConversationTranscriptRecord } from '../models/ListBodyConversationTranscriptRecord';
import type { ListBodyExtmsgAdapterInfo } from '../models/ListBodyExtmsgAdapterInfo';
import type { ListBodyProviderPatch } from '../models/ListBodyProviderPatch';
import type { ListBodyProviderResponse } from '../models/ListBodyProviderResponse';
import type { ListBodyRigPatch } from '../models/ListBodyRigPatch';
import type { ListBodyRigResponse } from '../models/ListBodyRigResponse';
import type { ListBodySessionBindingRecord } from '../models/ListBodySessionBindingRecord';
import type { ListBodySessionResponse } from '../models/ListBodySessionResponse';
import type { ListBodyStatus } from '../models/ListBodyStatus';
import type { ListBodyWireEvent } from '../models/ListBodyWireEvent';
import type { MailCountOutputBody } from '../models/MailCountOutputBody';
import type { MailListBody } from '../models/MailListBody';
import type { MailReplyInputBody } from '../models/MailReplyInputBody';
import type { MailSendInputBody } from '../models/MailSendInputBody';
import type { MaintenanceStatusBody } from '../models/MaintenanceStatusBody';
import type { MaintenanceTriggerBody } from '../models/MaintenanceTriggerBody';
import type { Message } from '../models/Message';
import type { OKResponseBody } from '../models/OKResponseBody';
import type { OKWithIDResponseBody } from '../models/OKWithIDResponseBody';
import type { OrderCheckListBody } from '../models/OrderCheckListBody';
import type { OrderHistoryDetailResponse } from '../models/OrderHistoryDetailResponse';
import type { OrderHistoryListBody } from '../models/OrderHistoryListBody';
import type { OrderListBody } from '../models/OrderListBody';
import type { OrderResponse } from '../models/OrderResponse';
import type { OrdersFeedBody } from '../models/OrdersFeedBody';
import type { OutboundResult } from '../models/OutboundResult';
import type { PackListBody } from '../models/PackListBody';
import type { PatchDeletedResponseBody } from '../models/PatchDeletedResponseBody';
import type { PatchOKResponseBody } from '../models/PatchOKResponseBody';
import type { PendingInteraction } from '../models/PendingInteraction';
import type { ProviderCreatedOutputBody } from '../models/ProviderCreatedOutputBody';
import type { ProviderCreateInputBody } from '../models/ProviderCreateInputBody';
import type { ProviderPatch } from '../models/ProviderPatch';
import type { ProviderPatchSetInputBody } from '../models/ProviderPatchSetInputBody';
import type { ProviderPublicListBody } from '../models/ProviderPublicListBody';
import type { ProviderReadinessResponse } from '../models/ProviderReadinessResponse';
import type { ProviderResponse } from '../models/ProviderResponse';
import type { ProviderUpdateInputBody } from '../models/ProviderUpdateInputBody';
import type { ReadinessResponse } from '../models/ReadinessResponse';
import type { RigActionBody } from '../models/RigActionBody';
import type { RigCreatedOutputBody } from '../models/RigCreatedOutputBody';
import type { RigCreateInputBody } from '../models/RigCreateInputBody';
import type { RigPatch } from '../models/RigPatch';
import type { RigPatchSetInputBody } from '../models/RigPatchSetInputBody';
import type { RigResponse } from '../models/RigResponse';
import type { RigUpdateInputBody } from '../models/RigUpdateInputBody';
import type { ServiceRestartOutputBody } from '../models/ServiceRestartOutputBody';
import type { SessionActivityEvent } from '../models/SessionActivityEvent';
import type { SessionAgentGetResponse } from '../models/SessionAgentGetResponse';
import type { SessionAgentListResponse } from '../models/SessionAgentListResponse';
import type { SessionBindingRecord } from '../models/SessionBindingRecord';
import type { SessionCreateBody } from '../models/SessionCreateBody';
import type { SessionMessageInputBody } from '../models/SessionMessageInputBody';
import type { SessionPatchBody } from '../models/SessionPatchBody';
import type { SessionPendingResponse } from '../models/SessionPendingResponse';
import type { SessionPermissionModeBody } from '../models/SessionPermissionModeBody';
import type { SessionRenameInputBody } from '../models/SessionRenameInputBody';
import type { SessionRespondInputBody } from '../models/SessionRespondInputBody';
import type { SessionRespondOutputBody } from '../models/SessionRespondOutputBody';
import type { SessionResponse } from '../models/SessionResponse';
import type { SessionStreamMessageEvent } from '../models/SessionStreamMessageEvent';
import type { SessionStreamRawMessageEvent } from '../models/SessionStreamRawMessageEvent';
import type { SessionSubmitInputBody } from '../models/SessionSubmitInputBody';
import type { SessionTranscriptGetResponse } from '../models/SessionTranscriptGetResponse';
import type { SlingInputBody } from '../models/SlingInputBody';
import type { SlingResponse } from '../models/SlingResponse';
import type { Status } from '../models/Status';
import type { StatusBody } from '../models/StatusBody';
import type { SupervisorCitiesOutputBody } from '../models/SupervisorCitiesOutputBody';
import type { SupervisorEventListOutputBody } from '../models/SupervisorEventListOutputBody';
import type { SupervisorHealthOutputBody } from '../models/SupervisorHealthOutputBody';
import type { TypedEventStreamEnvelope } from '../models/TypedEventStreamEnvelope';
import type { TypedTaggedEventStreamEnvelope } from '../models/TypedTaggedEventStreamEnvelope';
import type { WorkflowDeleteResponse } from '../models/WorkflowDeleteResponse';
import type { WorkflowSnapshotResponse } from '../models/WorkflowSnapshotResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Get health
     * @returns SupervisorHealthOutputBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<SupervisorHealthOutputBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Get v0 cities
     * @returns SupervisorCitiesOutputBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0Cities(): CancelablePromise<SupervisorCitiesOutputBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/cities',
        });
    }
    /**
     * Post v0 city
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns AsyncAcceptedResponse Accepted
     * @throws ApiError
     */
    public static postV0City(
        xGcRequest: string,
        requestBody: CityCreateRequest,
    ): CancelablePromise<ErrorModel | AsyncAcceptedResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city',
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name
     * @param cityName City name.
     * @returns CityGetResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityName(
        cityName: string,
    ): CancelablePromise<CityGetResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Patch v0 city by city name
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static patchV0CityByCityName(
        xGcRequest: string,
        cityName: string,
        requestBody: CityPatchInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v0/city/{cityName}',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete v0 city by city name agent by base
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param base Agent name (unqualified).
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameAgentByBase(
        xGcRequest: string,
        cityName: string,
        base: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/agent/{base}',
            path: {
                'cityName': cityName,
                'base': base,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name agent by base
     * @param cityName City name.
     * @param base Agent name (unqualified, no rig).
     * @returns AgentResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameAgentByBase(
        cityName: string,
        base: string,
    ): CancelablePromise<AgentResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/agent/{base}',
            path: {
                'cityName': cityName,
                'base': base,
            },
        });
    }
    /**
     * Patch v0 city by city name agent by base
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param base Agent name (unqualified).
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static patchV0CityByCityNameAgentByBase(
        xGcRequest: string,
        cityName: string,
        base: string,
        requestBody: AgentUpdateInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v0/city/{cityName}/agent/{base}',
            path: {
                'cityName': cityName,
                'base': base,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name agent by base output
     * @param cityName City name.
     * @param base Agent base name.
     * @param tail Number of recent compaction segments to return. This API parameter keeps compaction-segment semantics even though gc session logs --tail counts displayed transcript entries. Omit for the endpoint default (usually 1); 0 returns all segments; N>0 returns the last N.
     * @param before Message UUID cursor for loading older messages.
     * @returns AgentOutputResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameAgentByBaseOutput(
        cityName: string,
        base: string,
        tail?: string,
        before?: string,
    ): CancelablePromise<AgentOutputResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/agent/{base}/output',
            path: {
                'cityName': cityName,
                'base': base,
            },
            query: {
                'tail': tail,
                'before': before,
            },
        });
    }
    /**
     * Stream agent output in real time
     * Server-Sent Events stream of agent output (session log tail or tmux pane polling).
     * @param cityName City name.
     * @param base Agent base name.
     * @returns any OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static streamAgentOutput(
        cityName: string,
        base: string,
    ): CancelablePromise<Array<({
        data: HeartbeatEvent;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    } | {
        data: AgentOutputResponse;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    })> | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/agent/{base}/output/stream',
            path: {
                'cityName': cityName,
                'base': base,
            },
        });
    }
    /**
     * Post v0 city by city name agent by base by action
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param base Agent name (unqualified).
     * @param action Action to perform.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameAgentByBaseByAction(
        xGcRequest: string,
        cityName: string,
        base: string,
        action: 'suspend' | 'resume',
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/agent/{base}/{action}',
            path: {
                'cityName': cityName,
                'base': base,
                'action': action,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Delete v0 city by city name agent by dir by base
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param dir Agent directory (rig name).
     * @param base Agent base name.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameAgentByDirByBase(
        xGcRequest: string,
        cityName: string,
        dir: string,
        base: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/agent/{dir}/{base}',
            path: {
                'cityName': cityName,
                'dir': dir,
                'base': base,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name agent by dir by base
     * @param cityName City name.
     * @param dir Agent directory (rig name).
     * @param base Agent base name.
     * @returns AgentResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameAgentByDirByBase(
        cityName: string,
        dir: string,
        base: string,
    ): CancelablePromise<AgentResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/agent/{dir}/{base}',
            path: {
                'cityName': cityName,
                'dir': dir,
                'base': base,
            },
        });
    }
    /**
     * Patch v0 city by city name agent by dir by base
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param dir Agent directory (rig name).
     * @param base Agent base name.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static patchV0CityByCityNameAgentByDirByBase(
        xGcRequest: string,
        cityName: string,
        dir: string,
        base: string,
        requestBody: AgentUpdateQualifiedInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v0/city/{cityName}/agent/{dir}/{base}',
            path: {
                'cityName': cityName,
                'dir': dir,
                'base': base,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name agent by dir by base output
     * @param cityName City name.
     * @param dir Agent directory (rig name).
     * @param base Agent base name.
     * @param tail Number of recent compaction segments to return. This API parameter keeps compaction-segment semantics even though gc session logs --tail counts displayed transcript entries. Omit for the endpoint default (usually 1); 0 returns all segments; N>0 returns the last N.
     * @param before Message UUID cursor for loading older messages.
     * @returns AgentOutputResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameAgentByDirByBaseOutput(
        cityName: string,
        dir: string,
        base: string,
        tail?: string,
        before?: string,
    ): CancelablePromise<AgentOutputResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/agent/{dir}/{base}/output',
            path: {
                'cityName': cityName,
                'dir': dir,
                'base': base,
            },
            query: {
                'tail': tail,
                'before': before,
            },
        });
    }
    /**
     * Stream agent output in real time (qualified name)
     * Server-Sent Events stream of agent output for qualified (rig-prefixed) agent names.
     * @param cityName City name.
     * @param dir Agent directory (rig name).
     * @param base Agent base name.
     * @returns any OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static streamAgentOutputQualified(
        cityName: string,
        dir: string,
        base: string,
    ): CancelablePromise<Array<({
        data: HeartbeatEvent;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    } | {
        data: AgentOutputResponse;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    })> | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/agent/{dir}/{base}/output/stream',
            path: {
                'cityName': cityName,
                'dir': dir,
                'base': base,
            },
        });
    }
    /**
     * Post v0 city by city name agent by dir by base by action
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param dir Agent directory (rig name).
     * @param base Agent base name.
     * @param action Action to perform.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameAgentByDirByBaseByAction(
        xGcRequest: string,
        cityName: string,
        dir: string,
        base: string,
        action: 'suspend' | 'resume',
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/agent/{dir}/{base}/{action}',
            path: {
                'cityName': cityName,
                'dir': dir,
                'base': base,
                'action': action,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name agents
     * @param cityName City name.
     * @param index Event sequence number; when provided, blocks until a newer event arrives.
     * @param wait How long to block waiting for changes (Go duration string, e.g. 30s). Default 30s, max 2m.
     * @param pool Filter by pool name.
     * @param rig Filter by rig name.
     * @param running Filter by running state. Omit to return all agents.
     * @param peek Include last output preview.
     * @returns ListBodyAgentResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameAgents(
        cityName: string,
        index?: string,
        wait?: string,
        pool?: string,
        rig?: string,
        running?: 'true' | 'false',
        peek?: boolean,
    ): CancelablePromise<ListBodyAgentResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/agents',
            path: {
                'cityName': cityName,
            },
            query: {
                'index': index,
                'wait': wait,
                'pool': pool,
                'rig': rig,
                'running': running,
                'peek': peek,
            },
        });
    }
    /**
     * Create an agent
     * Creates an agent and waits until it is visible to immediate follow-up operations. If the agent is durably created but visibility confirmation is canceled or times out, the retryable 503/504 response includes a Retry-After header.
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns AgentCreatedOutputBody Created
     * @throws ApiError
     */
    public static createAgent(
        xGcRequest: string,
        cityName: string,
        requestBody: AgentCreateInputBody,
    ): CancelablePromise<ErrorModel | AgentCreatedOutputBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/agents',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete v0 city by city name bead by ID
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Bead ID.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameBeadById(
        xGcRequest: string,
        cityName: string,
        id: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/bead/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name bead by ID
     * @param cityName City name.
     * @param id Bead ID.
     * @returns Bead OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameBeadById(
        cityName: string,
        id: string,
    ): CancelablePromise<Bead | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/bead/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
        });
    }
    /**
     * Patch v0 city by city name bead by ID
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Bead ID.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static patchV0CityByCityNameBeadById(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: BeadUpdateBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v0/city/{cityName}/bead/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name bead by ID assign
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Bead ID.
     * @param requestBody
     * @returns string OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameBeadByIdAssign(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: BeadAssignInputBody,
    ): CancelablePromise<Record<string, string> | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/bead/{id}/assign',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name bead by ID close
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Bead ID.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameBeadByIdClose(
        xGcRequest: string,
        cityName: string,
        id: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/bead/{id}/close',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name bead by ID deps
     * @param cityName City name.
     * @param id Bead ID.
     * @returns BeadDepsResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameBeadByIdDeps(
        cityName: string,
        id: string,
    ): CancelablePromise<BeadDepsResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/bead/{id}/deps',
            path: {
                'cityName': cityName,
                'id': id,
            },
        });
    }
    /**
     * Post v0 city by city name bead by ID reopen
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Bead ID.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameBeadByIdReopen(
        xGcRequest: string,
        cityName: string,
        id: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/bead/{id}/reopen',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Post v0 city by city name bead by ID update
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Bead ID.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameBeadByIdUpdate(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: BeadUpdateBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/bead/{id}/update',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name beads
     * @param cityName City name.
     * @param index Event sequence number; when provided, blocks until a newer event arrives.
     * @param wait How long to block waiting for changes (Go duration string, e.g. 30s). Default 30s, max 2m.
     * @param cursor Pagination cursor from a previous response's next_cursor field.
     * @param limit Maximum number of results to return. 0 = server default.
     * @param status Filter by bead status.
     * @param type Filter by bead type.
     * @param label Filter by label.
     * @param assignee Filter by assignee.
     * @param rig Filter by rig.
     * @param all Include closed beads.
     * @returns ListBodyBead OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameBeads(
        cityName: string,
        index?: string,
        wait?: string,
        cursor?: string,
        limit?: number,
        status?: string,
        type?: string,
        label?: string,
        assignee?: string,
        rig?: string,
        all?: boolean,
    ): CancelablePromise<ListBodyBead | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/beads',
            path: {
                'cityName': cityName,
            },
            query: {
                'index': index,
                'wait': wait,
                'cursor': cursor,
                'limit': limit,
                'status': status,
                'type': type,
                'label': label,
                'assignee': assignee,
                'rig': rig,
                'all': all,
            },
        });
    }
    /**
     * Create a bead
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @param idempotencyKey Idempotency key for safe retries.
     * @returns ErrorModel Error
     * @returns Bead Created
     * @throws ApiError
     */
    public static createBead(
        xGcRequest: string,
        cityName: string,
        requestBody: BeadCreateInputBody,
        idempotencyKey?: string,
    ): CancelablePromise<ErrorModel | Bead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/beads',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
                'Idempotency-Key': idempotencyKey,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name beads graph by root ID
     * @param cityName City name.
     * @param rootId Root bead ID for the graph.
     * @returns BeadGraphResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameBeadsGraphByRootId(
        cityName: string,
        rootId: string,
    ): CancelablePromise<BeadGraphResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/beads/graph/{rootID}',
            path: {
                'cityName': cityName,
                'rootID': rootId,
            },
        });
    }
    /**
     * Get v0 city by city name beads ready
     * @param cityName City name.
     * @param index Event sequence number; when provided, blocks until a newer event arrives.
     * @param wait How long to block waiting for changes (Go duration string, e.g. 30s). Default 30s, max 2m.
     * @returns ListBodyBead OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameBeadsReady(
        cityName: string,
        index?: string,
        wait?: string,
    ): CancelablePromise<ListBodyBead | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/beads/ready',
            path: {
                'cityName': cityName,
            },
            query: {
                'index': index,
                'wait': wait,
            },
        });
    }
    /**
     * Get v0 city by city name config
     * @param cityName City name.
     * @returns ConfigResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameConfig(
        cityName: string,
    ): CancelablePromise<ConfigResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/config',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Get v0 city by city name config defaults
     * @param cityName City name.
     * @returns ConfigResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameConfigDefaults(
        cityName: string,
    ): CancelablePromise<ConfigResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/config/defaults',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Get v0 city by city name config explain
     * @param cityName City name.
     * @returns ConfigExplainResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameConfigExplain(
        cityName: string,
    ): CancelablePromise<ConfigExplainResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/config/explain',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Get v0 city by city name config validate
     * @param cityName City name.
     * @returns ConfigValidateOutputBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameConfigValidate(
        cityName: string,
    ): CancelablePromise<ConfigValidateOutputBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/config/validate',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Delete v0 city by city name convoy by ID
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Convoy ID.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameConvoyById(
        xGcRequest: string,
        cityName: string,
        id: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/convoy/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name convoy by ID
     * @param cityName City name.
     * @param id Convoy ID.
     * @returns ConvoyGetResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameConvoyById(
        cityName: string,
        id: string,
    ): CancelablePromise<ConvoyGetResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/convoy/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
        });
    }
    /**
     * Post v0 city by city name convoy by ID add
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Convoy ID.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameConvoyByIdAdd(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: ConvoyAddInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/convoy/{id}/add',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name convoy by ID check
     * @param cityName City name.
     * @param id Convoy ID.
     * @returns ConvoyCheckResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameConvoyByIdCheck(
        cityName: string,
        id: string,
    ): CancelablePromise<ConvoyCheckResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/convoy/{id}/check',
            path: {
                'cityName': cityName,
                'id': id,
            },
        });
    }
    /**
     * Post v0 city by city name convoy by ID close
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Convoy ID.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameConvoyByIdClose(
        xGcRequest: string,
        cityName: string,
        id: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/convoy/{id}/close',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Post v0 city by city name convoy by ID remove
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Convoy ID.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameConvoyByIdRemove(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: ConvoyRemoveInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/convoy/{id}/remove',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name convoys
     * @param cityName City name.
     * @param index Event sequence number; when provided, blocks until a newer event arrives.
     * @param wait How long to block waiting for changes (Go duration string, e.g. 30s). Default 30s, max 2m.
     * @param cursor Pagination cursor from a previous response's next_cursor field.
     * @param limit Maximum number of results to return. 0 = server default.
     * @returns ListBodyBead OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameConvoys(
        cityName: string,
        index?: string,
        wait?: string,
        cursor?: string,
        limit?: number,
    ): CancelablePromise<ListBodyBead | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/convoys',
            path: {
                'cityName': cityName,
            },
            query: {
                'index': index,
                'wait': wait,
                'cursor': cursor,
                'limit': limit,
            },
        });
    }
    /**
     * Create a convoy
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns Bead Created
     * @throws ApiError
     */
    public static createConvoy(
        xGcRequest: string,
        cityName: string,
        requestBody: ConvoyCreateInputBody,
    ): CancelablePromise<ErrorModel | Bead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/convoys',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name events
     * @param cityName City name.
     * @param index Event sequence number; when provided, blocks until a newer event arrives.
     * @param wait How long to block waiting for changes (Go duration string, e.g. 30s). Default 30s, max 2m.
     * @param cursor Pagination cursor from a previous response's next_cursor field.
     * @param limit Maximum number of results to return. 0 = server default.
     * @param type Filter by event type.
     * @param actor Filter by actor.
     * @param since Filter events since duration ago (Go duration string, e.g. 5m).
     * @returns ListBodyWireEvent OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameEvents(
        cityName: string,
        index?: string,
        wait?: string,
        cursor?: string,
        limit?: number,
        type?: string,
        actor?: string,
        since?: string,
    ): CancelablePromise<ListBodyWireEvent | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/events',
            path: {
                'cityName': cityName,
            },
            query: {
                'index': index,
                'wait': wait,
                'cursor': cursor,
                'limit': limit,
                'type': type,
                'actor': actor,
                'since': since,
            },
        });
    }
    /**
     * Emit an event
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns EventEmitOutputBody Created
     * @throws ApiError
     */
    public static emitEvent(
        xGcRequest: string,
        cityName: string,
        requestBody: EventEmitRequest,
    ): CancelablePromise<ErrorModel | EventEmitOutputBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/events',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Force rotate the city event log
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param wait Wait for archive compression to complete before returning.
     * @returns EventRotateResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static rotateEvents(
        xGcRequest: string,
        cityName: string,
        wait?: boolean,
    ): CancelablePromise<EventRotateResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/events/rotate',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            query: {
                'wait': wait,
            },
        });
    }
    /**
     * Stream city events in real time
     * Server-Sent Events stream of city events with optional workflow projections. Supports reconnection via Last-Event-ID header or after_seq query param; omitting both starts at the current city event head.
     * @param cityName City name.
     * @param afterSeq Reconnect position: only deliver events after this sequence number. Omit after_seq and Last-Event-ID to start at the current city event head.
     * @param lastEventId SSE reconnect position from the last received event ID. Omit Last-Event-ID and after_seq to start at the current city event head.
     * @returns any OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static streamEvents(
        cityName: string,
        afterSeq?: string,
        lastEventId?: string,
    ): CancelablePromise<Array<({
        data: TypedEventStreamEnvelope;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    } | {
        data: HeartbeatEvent;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    })> | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/events/stream',
            path: {
                'cityName': cityName,
            },
            headers: {
                'Last-Event-ID': lastEventId,
            },
            query: {
                'after_seq': afterSeq,
            },
        });
    }
    /**
     * Delete v0 city by city name extmsg adapters
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameExtmsgAdapters(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgAdapterUnregisterInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/extmsg/adapters',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name extmsg adapters
     * @param cityName City name.
     * @returns ListBodyExtmsgAdapterInfo OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameExtmsgAdapters(
        cityName: string,
    ): CancelablePromise<ListBodyExtmsgAdapterInfo | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/extmsg/adapters',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Register an external messaging adapter
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns ExtMsgAdapterRegisterOutputBody Created
     * @throws ApiError
     */
    public static registerExtmsgAdapter(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgAdapterRegisterInputBody,
    ): CancelablePromise<ErrorModel | ExtMsgAdapterRegisterOutputBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/extmsg/adapters',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name extmsg bind
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns SessionBindingRecord OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameExtmsgBind(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgBindInputBody,
    ): CancelablePromise<SessionBindingRecord | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/extmsg/bind',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name extmsg bindings
     * @param cityName City name.
     * @param sessionId Session ID to list bindings for.
     * @returns ListBodySessionBindingRecord OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameExtmsgBindings(
        cityName: string,
        sessionId?: string,
    ): CancelablePromise<ListBodySessionBindingRecord | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/extmsg/bindings',
            path: {
                'cityName': cityName,
            },
            query: {
                'session_id': sessionId,
            },
        });
    }
    /**
     * Get v0 city by city name extmsg groups
     * @param cityName City name.
     * @param scopeId Scope ID.
     * @param provider Provider name.
     * @param accountId Account ID.
     * @param conversationId Conversation ID.
     * @param kind Conversation kind.
     * @returns ConversationGroupRecord OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameExtmsgGroups(
        cityName: string,
        scopeId?: string,
        provider?: string,
        accountId?: string,
        conversationId?: string,
        kind?: string,
    ): CancelablePromise<ConversationGroupRecord | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/extmsg/groups',
            path: {
                'cityName': cityName,
            },
            query: {
                'scope_id': scopeId,
                'provider': provider,
                'account_id': accountId,
                'conversation_id': conversationId,
                'kind': kind,
            },
        });
    }
    /**
     * Ensure an external messaging group exists
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns ConversationGroupRecord Created
     * @throws ApiError
     */
    public static ensureExtmsgGroup(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgGroupEnsureInputBody,
    ): CancelablePromise<ErrorModel | ConversationGroupRecord> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/extmsg/groups',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name extmsg inbound
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns InboundResult OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameExtmsgInbound(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgInboundInputBody,
    ): CancelablePromise<InboundResult | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/extmsg/inbound',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name extmsg outbound
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns OutboundResult OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameExtmsgOutbound(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgOutboundInputBody,
    ): CancelablePromise<OutboundResult | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/extmsg/outbound',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete v0 city by city name extmsg participants
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameExtmsgParticipants(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgParticipantRemoveInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/extmsg/participants',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name extmsg participants
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ConversationGroupParticipant OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameExtmsgParticipants(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgParticipantUpsertInputBody,
    ): CancelablePromise<ConversationGroupParticipant | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/extmsg/participants',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name extmsg transcript
     * @param cityName City name.
     * @param scopeId Scope ID.
     * @param provider Provider name.
     * @param accountId Account ID.
     * @param conversationId Conversation ID.
     * @param parentConversationId Parent conversation ID.
     * @param kind Conversation kind.
     * @param afterSequence Return entries with sequence greater than this cursor (default 0).
     * @param limit Maximum number of entries to return (default 100, max 500).
     * @param order Sort order by sequence: asc (oldest-first, default) or desc (newest-first).
     * @returns ListBodyConversationTranscriptRecord OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameExtmsgTranscript(
        cityName: string,
        scopeId?: string,
        provider?: string,
        accountId?: string,
        conversationId?: string,
        parentConversationId?: string,
        kind?: string,
        afterSequence?: number,
        limit?: number,
        order?: 'asc' | 'desc',
    ): CancelablePromise<ListBodyConversationTranscriptRecord | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/extmsg/transcript',
            path: {
                'cityName': cityName,
            },
            query: {
                'scope_id': scopeId,
                'provider': provider,
                'account_id': accountId,
                'conversation_id': conversationId,
                'parent_conversation_id': parentConversationId,
                'kind': kind,
                'after_sequence': afterSequence,
                'limit': limit,
                'order': order,
            },
        });
    }
    /**
     * Post v0 city by city name extmsg transcript ack
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameExtmsgTranscriptAck(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgTranscriptAckInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/extmsg/transcript/ack',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name extmsg unbind
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ExtMsgUnbindBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameExtmsgUnbind(
        xGcRequest: string,
        cityName: string,
        requestBody: ExtMsgUnbindInputBody,
    ): CancelablePromise<ExtMsgUnbindBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/extmsg/unbind',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name formula by name
     * @param cityName City name.
     * @param name Formula name.
     * @param target Preview target: a bead or convoy ID, or a configured agent identity (for example a workflow root's gc.routed_to value).
     * @param scopeKind Scope kind (city or rig).
     * @param scopeRef Scope reference.
     * @returns FormulaDetailResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameFormulaByName(
        cityName: string,
        name: string,
        target: string,
        scopeKind?: string,
        scopeRef?: string,
    ): CancelablePromise<FormulaDetailResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/formula/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
            query: {
                'scope_kind': scopeKind,
                'scope_ref': scopeRef,
                'target': target,
            },
        });
    }
    /**
     * Get v0 city by city name formulas
     * @param cityName City name.
     * @param scopeKind Scope kind (city or rig).
     * @param scopeRef Scope reference.
     * @returns FormulaListBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameFormulas(
        cityName: string,
        scopeKind?: string,
        scopeRef?: string,
    ): CancelablePromise<FormulaListBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/formulas',
            path: {
                'cityName': cityName,
            },
            query: {
                'scope_kind': scopeKind,
                'scope_ref': scopeRef,
            },
        });
    }
    /**
     * Get v0 city by city name formulas feed
     * @param cityName City name.
     * @param scopeKind Scope kind (city or rig).
     * @param scopeRef Scope reference.
     * @param limit Maximum number of feed items to return. 0 = default.
     * @returns FormulaFeedBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameFormulasFeed(
        cityName: string,
        scopeKind?: string,
        scopeRef?: string,
        limit?: number,
    ): CancelablePromise<FormulaFeedBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/formulas/feed',
            path: {
                'cityName': cityName,
            },
            query: {
                'scope_kind': scopeKind,
                'scope_ref': scopeRef,
                'limit': limit,
            },
        });
    }
    /**
     * Get v0 city by city name formulas by name
     * @param cityName City name.
     * @param name Formula name.
     * @param target Preview target: a bead or convoy ID, or a configured agent identity (for example a workflow root's gc.routed_to value).
     * @param scopeKind Scope kind (city or rig).
     * @param scopeRef Scope reference.
     * @returns FormulaDetailResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameFormulasByName(
        cityName: string,
        name: string,
        target: string,
        scopeKind?: string,
        scopeRef?: string,
    ): CancelablePromise<FormulaDetailResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/formulas/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
            query: {
                'scope_kind': scopeKind,
                'scope_ref': scopeRef,
                'target': target,
            },
        });
    }
    /**
     * Post v0 city by city name formulas by name preview
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Formula name.
     * @param requestBody
     * @returns FormulaDetailResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameFormulasByNamePreview(
        xGcRequest: string,
        cityName: string,
        name: string,
        requestBody: FormulaPreviewBody,
    ): CancelablePromise<FormulaDetailResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/formulas/{name}/preview',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name formulas by name runs
     * @param cityName City name.
     * @param name Formula name.
     * @param scopeKind Scope kind (city or rig).
     * @param scopeRef Scope reference.
     * @param limit Maximum number of recent runs to return. 0 = default.
     * @returns FormulaRunsResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameFormulasByNameRuns(
        cityName: string,
        name: string,
        scopeKind?: string,
        scopeRef?: string,
        limit?: number,
    ): CancelablePromise<FormulaRunsResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/formulas/{name}/runs',
            path: {
                'cityName': cityName,
                'name': name,
            },
            query: {
                'scope_kind': scopeKind,
                'scope_ref': scopeRef,
                'limit': limit,
            },
        });
    }
    /**
     * Get v0 city by city name health
     * @param cityName City name.
     * @returns HealthOutputBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameHealth(
        cityName: string,
    ): CancelablePromise<HealthOutputBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/health',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Get v0 city by city name mail
     * @param cityName City name.
     * @param index Event sequence number; when provided, blocks until a newer event arrives.
     * @param wait How long to block waiting for changes (Go duration string, e.g. 30s). Default 30s, max 2m.
     * @param cursor Pagination cursor from a previous response's next_cursor field.
     * @param limit Maximum number of results to return. 0 = server default.
     * @param agent Filter by agent name.
     * @param status Filter by status (unread, all).
     * @param rig Filter by rig name.
     * @returns MailListBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameMail(
        cityName: string,
        index?: string,
        wait?: string,
        cursor?: string,
        limit?: number,
        agent?: string,
        status?: string,
        rig?: string,
    ): CancelablePromise<MailListBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/mail',
            path: {
                'cityName': cityName,
            },
            query: {
                'index': index,
                'wait': wait,
                'cursor': cursor,
                'limit': limit,
                'agent': agent,
                'status': status,
                'rig': rig,
            },
        });
    }
    /**
     * Send a mail message
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @param idempotencyKey Idempotency key for safe retries.
     * @returns ErrorModel Error
     * @returns Message Created
     * @throws ApiError
     */
    public static sendMail(
        xGcRequest: string,
        cityName: string,
        requestBody: MailSendInputBody,
        idempotencyKey?: string,
    ): CancelablePromise<ErrorModel | Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/mail',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
                'Idempotency-Key': idempotencyKey,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name mail count
     * @param cityName City name.
     * @param agent Filter by agent name.
     * @param rig Filter by rig name.
     * @returns MailCountOutputBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameMailCount(
        cityName: string,
        agent?: string,
        rig?: string,
    ): CancelablePromise<MailCountOutputBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/mail/count',
            path: {
                'cityName': cityName,
            },
            query: {
                'agent': agent,
                'rig': rig,
            },
        });
    }
    /**
     * Get v0 city by city name mail thread by ID
     * @param cityName City name.
     * @param id Thread ID, or any message ID in the thread.
     * @param rig Filter by rig.
     * @returns MailListBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameMailThreadById(
        cityName: string,
        id: string,
        rig?: string,
    ): CancelablePromise<MailListBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/mail/thread/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
            query: {
                'rig': rig,
            },
        });
    }
    /**
     * Delete v0 city by city name mail by ID
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Message ID.
     * @param rig Rig hint.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameMailById(
        xGcRequest: string,
        cityName: string,
        id: string,
        rig?: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/mail/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            query: {
                'rig': rig,
            },
        });
    }
    /**
     * Get v0 city by city name mail by ID
     * @param cityName City name.
     * @param id Message ID.
     * @param rig Rig hint for O(1) lookup.
     * @returns Message OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameMailById(
        cityName: string,
        id: string,
        rig?: string,
    ): CancelablePromise<Message | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/mail/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
            query: {
                'rig': rig,
            },
        });
    }
    /**
     * Post v0 city by city name mail by ID archive
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Message ID.
     * @param rig Rig hint.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameMailByIdArchive(
        xGcRequest: string,
        cityName: string,
        id: string,
        rig?: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/mail/{id}/archive',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            query: {
                'rig': rig,
            },
        });
    }
    /**
     * Post v0 city by city name mail by ID mark unread
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Message ID.
     * @param rig Rig hint.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameMailByIdMarkUnread(
        xGcRequest: string,
        cityName: string,
        id: string,
        rig?: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/mail/{id}/mark-unread',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            query: {
                'rig': rig,
            },
        });
    }
    /**
     * Post v0 city by city name mail by ID read
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Message ID.
     * @param rig Rig hint.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameMailByIdRead(
        xGcRequest: string,
        cityName: string,
        id: string,
        rig?: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/mail/{id}/read',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            query: {
                'rig': rig,
            },
        });
    }
    /**
     * Reply to a mail message
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Message ID.
     * @param requestBody
     * @param rig Rig hint.
     * @returns ErrorModel Error
     * @returns Message Created
     * @throws ApiError
     */
    public static replyMail(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: MailReplyInputBody,
        rig?: string,
    ): CancelablePromise<ErrorModel | Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/mail/{id}/reply',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            query: {
                'rig': rig,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Trigger a Dolt store maintenance run
     * Trigger a one-off maintenance cycle (dolt backup + CALL DOLT_GC + smoke test). Default async (202); ?wait=true blocks until completion (200). Returns 409 when a run is already in flight.
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param wait When true, the handler blocks until the run completes and returns 200 with the full Run. When false (default), the handler returns 202 Accepted immediately.
     * @returns ErrorModel Error
     * @returns MaintenanceTriggerBody Accepted
     * @throws ApiError
     */
    public static triggerMaintenanceDoltGc(
        xGcRequest: string,
        cityName: string,
        wait?: boolean,
    ): CancelablePromise<ErrorModel | MaintenanceTriggerBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/maintenance/dolt-gc',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            query: {
                'wait': wait,
            },
        });
    }
    /**
     * Get v0 city by city name maintenance status
     * @param cityName City name.
     * @returns MaintenanceStatusBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameMaintenanceStatus(
        cityName: string,
    ): CancelablePromise<MaintenanceStatusBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/maintenance/status',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Get v0 city by city name order history by bead ID
     * @param cityName City name.
     * @param beadId Bead ID for the order run.
     * @param storeRef Store reference for disambiguating store-local bead IDs.
     * @returns OrderHistoryDetailResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameOrderHistoryByBeadId(
        cityName: string,
        beadId: string,
        storeRef?: string,
    ): CancelablePromise<OrderHistoryDetailResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/order/history/{bead_id}',
            path: {
                'cityName': cityName,
                'bead_id': beadId,
            },
            query: {
                'store_ref': storeRef,
            },
        });
    }
    /**
     * Get v0 city by city name order by name
     * @param cityName City name.
     * @param name Order name or scoped name.
     * @returns OrderResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameOrderByName(
        cityName: string,
        name: string,
    ): CancelablePromise<OrderResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/order/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
        });
    }
    /**
     * Post v0 city by city name order by name disable
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Order name or scoped name.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameOrderByNameDisable(
        xGcRequest: string,
        cityName: string,
        name: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/order/{name}/disable',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Post v0 city by city name order by name enable
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Order name or scoped name.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameOrderByNameEnable(
        xGcRequest: string,
        cityName: string,
        name: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/order/{name}/enable',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name orders
     * @param cityName City name.
     * @returns OrderListBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameOrders(
        cityName: string,
    ): CancelablePromise<OrderListBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/orders',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Get v0 city by city name orders check
     * @param cityName City name.
     * @param fresh Bypass cached order-check responses and cached order history.
     * @returns OrderCheckListBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameOrdersCheck(
        cityName: string,
        fresh?: boolean,
    ): CancelablePromise<OrderCheckListBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/orders/check',
            path: {
                'cityName': cityName,
            },
            query: {
                'fresh': fresh,
            },
        });
    }
    /**
     * Get v0 city by city name orders feed
     * @param cityName City name.
     * @param scopeKind Scope kind (city or rig).
     * @param scopeRef Scope reference.
     * @param limit Maximum number of feed items to return.
     * @returns OrdersFeedBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameOrdersFeed(
        cityName: string,
        scopeKind?: string,
        scopeRef?: string,
        limit?: number,
    ): CancelablePromise<OrdersFeedBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/orders/feed',
            path: {
                'cityName': cityName,
            },
            query: {
                'scope_kind': scopeKind,
                'scope_ref': scopeRef,
                'limit': limit,
            },
        });
    }
    /**
     * Get v0 city by city name orders history
     * @param cityName City name.
     * @param scopedName Scoped order name.
     * @param limit Maximum number of history entries. 0 = default.
     * @param before Return entries before this RFC3339 timestamp.
     * @returns OrderHistoryListBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameOrdersHistory(
        cityName: string,
        scopedName: string,
        limit?: number,
        before?: string,
    ): CancelablePromise<OrderHistoryListBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/orders/history',
            path: {
                'cityName': cityName,
            },
            query: {
                'scoped_name': scopedName,
                'limit': limit,
                'before': before,
            },
        });
    }
    /**
     * Get v0 city by city name packs
     * @param cityName City name.
     * @returns PackListBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNamePacks(
        cityName: string,
    ): CancelablePromise<PackListBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/packs',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Delete v0 city by city name patches agent by base
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param base Agent patch name (unqualified).
     * @returns PatchDeletedResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNamePatchesAgentByBase(
        xGcRequest: string,
        cityName: string,
        base: string,
    ): CancelablePromise<PatchDeletedResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/patches/agent/{base}',
            path: {
                'cityName': cityName,
                'base': base,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name patches agent by base
     * @param cityName City name.
     * @param base Agent patch name (unqualified).
     * @returns AgentPatch OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNamePatchesAgentByBase(
        cityName: string,
        base: string,
    ): CancelablePromise<AgentPatch | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/patches/agent/{base}',
            path: {
                'cityName': cityName,
                'base': base,
            },
        });
    }
    /**
     * Delete v0 city by city name patches agent by dir by base
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param dir Agent directory (rig name).
     * @param base Agent base name.
     * @returns PatchDeletedResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNamePatchesAgentByDirByBase(
        xGcRequest: string,
        cityName: string,
        dir: string,
        base: string,
    ): CancelablePromise<PatchDeletedResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/patches/agent/{dir}/{base}',
            path: {
                'cityName': cityName,
                'dir': dir,
                'base': base,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name patches agent by dir by base
     * @param cityName City name.
     * @param dir Agent directory (rig name).
     * @param base Agent base name.
     * @returns AgentPatch OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNamePatchesAgentByDirByBase(
        cityName: string,
        dir: string,
        base: string,
    ): CancelablePromise<AgentPatch | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/patches/agent/{dir}/{base}',
            path: {
                'cityName': cityName,
                'dir': dir,
                'base': base,
            },
        });
    }
    /**
     * Get v0 city by city name patches agents
     * @param cityName City name.
     * @returns ListBodyAgentPatch OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNamePatchesAgents(
        cityName: string,
    ): CancelablePromise<ListBodyAgentPatch | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/patches/agents',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Put v0 city by city name patches agents
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns PatchOKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static putV0CityByCityNamePatchesAgents(
        xGcRequest: string,
        cityName: string,
        requestBody: AgentPatchSetInputBody,
    ): CancelablePromise<PatchOKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/v0/city/{cityName}/patches/agents',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete v0 city by city name patches provider by name
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Provider patch name.
     * @returns PatchDeletedResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNamePatchesProviderByName(
        xGcRequest: string,
        cityName: string,
        name: string,
    ): CancelablePromise<PatchDeletedResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/patches/provider/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name patches provider by name
     * @param cityName City name.
     * @param name Provider patch name.
     * @returns ProviderPatch OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNamePatchesProviderByName(
        cityName: string,
        name: string,
    ): CancelablePromise<ProviderPatch | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/patches/provider/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
        });
    }
    /**
     * Get v0 city by city name patches providers
     * @param cityName City name.
     * @returns ListBodyProviderPatch OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNamePatchesProviders(
        cityName: string,
    ): CancelablePromise<ListBodyProviderPatch | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/patches/providers',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Put v0 city by city name patches providers
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns PatchOKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static putV0CityByCityNamePatchesProviders(
        xGcRequest: string,
        cityName: string,
        requestBody: ProviderPatchSetInputBody,
    ): CancelablePromise<PatchOKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/v0/city/{cityName}/patches/providers',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete v0 city by city name patches rig by name
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Rig patch name.
     * @returns PatchDeletedResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNamePatchesRigByName(
        xGcRequest: string,
        cityName: string,
        name: string,
    ): CancelablePromise<PatchDeletedResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/patches/rig/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name patches rig by name
     * @param cityName City name.
     * @param name Rig patch name.
     * @returns RigPatch OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNamePatchesRigByName(
        cityName: string,
        name: string,
    ): CancelablePromise<RigPatch | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/patches/rig/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
        });
    }
    /**
     * Get v0 city by city name patches rigs
     * @param cityName City name.
     * @returns ListBodyRigPatch OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNamePatchesRigs(
        cityName: string,
    ): CancelablePromise<ListBodyRigPatch | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/patches/rigs',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Put v0 city by city name patches rigs
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns PatchOKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static putV0CityByCityNamePatchesRigs(
        xGcRequest: string,
        cityName: string,
        requestBody: RigPatchSetInputBody,
    ): CancelablePromise<PatchOKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/v0/city/{cityName}/patches/rigs',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name pending
     * @param cityName City name.
     * @returns ListBodyCityPendingEntry OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNamePending(
        cityName: string,
    ): CancelablePromise<ListBodyCityPendingEntry | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/pending',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Get v0 city by city name provider readiness
     * @param cityName City name.
     * @param providers Comma-separated provider names to check (default: claude,codex,gemini).
     * @param fresh Force fresh probe, bypassing cache.
     * @returns ProviderReadinessResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameProviderReadiness(
        cityName: string,
        providers?: string,
        fresh?: boolean,
    ): CancelablePromise<ProviderReadinessResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/provider-readiness',
            path: {
                'cityName': cityName,
            },
            query: {
                'providers': providers,
                'fresh': fresh,
            },
        });
    }
    /**
     * Delete v0 city by city name provider by name
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Provider name.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameProviderByName(
        xGcRequest: string,
        cityName: string,
        name: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/provider/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name provider by name
     * @param cityName City name.
     * @param name Provider name.
     * @returns ProviderResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameProviderByName(
        cityName: string,
        name: string,
    ): CancelablePromise<ProviderResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/provider/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
        });
    }
    /**
     * Patch v0 city by city name provider by name
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Provider name.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static patchV0CityByCityNameProviderByName(
        xGcRequest: string,
        cityName: string,
        name: string,
        requestBody: ProviderUpdateInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v0/city/{cityName}/provider/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name providers
     * @param cityName City name.
     * @returns ListBodyProviderResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameProviders(
        cityName: string,
    ): CancelablePromise<ListBodyProviderResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/providers',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Create a provider
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns ProviderCreatedOutputBody Created
     * @throws ApiError
     */
    public static createProvider(
        xGcRequest: string,
        cityName: string,
        requestBody: ProviderCreateInputBody,
    ): CancelablePromise<ErrorModel | ProviderCreatedOutputBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/providers',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name providers public
     * @param cityName City name.
     * @returns ProviderPublicListBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameProvidersPublic(
        cityName: string,
    ): CancelablePromise<ProviderPublicListBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/providers/public',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Get v0 city by city name readiness
     * @param cityName City name.
     * @param items Comma-separated readiness items to check (default: claude,codex,gemini,github_cli).
     * @param fresh Force fresh probe, bypassing cache.
     * @returns ReadinessResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameReadiness(
        cityName: string,
        items?: string,
        fresh?: boolean,
    ): CancelablePromise<ReadinessResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/readiness',
            path: {
                'cityName': cityName,
            },
            query: {
                'items': items,
                'fresh': fresh,
            },
        });
    }
    /**
     * Delete v0 city by city name rig by name
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Rig name.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameRigByName(
        xGcRequest: string,
        cityName: string,
        name: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/rig/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name rig by name
     * @param cityName City name.
     * @param name Rig name.
     * @param git Include git status.
     * @returns RigResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameRigByName(
        cityName: string,
        name: string,
        git?: boolean,
    ): CancelablePromise<RigResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/rig/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
            query: {
                'git': git,
            },
        });
    }
    /**
     * Patch v0 city by city name rig by name
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Rig name.
     * @param requestBody
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static patchV0CityByCityNameRigByName(
        xGcRequest: string,
        cityName: string,
        name: string,
        requestBody: RigUpdateInputBody,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v0/city/{cityName}/rig/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name rig by name by action
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Rig name.
     * @param action Action to perform (suspend, resume, restart).
     * @returns RigActionBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameRigByNameByAction(
        xGcRequest: string,
        cityName: string,
        name: string,
        action: string,
    ): CancelablePromise<RigActionBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/rig/{name}/{action}',
            path: {
                'cityName': cityName,
                'name': name,
                'action': action,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name rigs
     * @param cityName City name.
     * @param index Event sequence number; when provided, blocks until a newer event arrives.
     * @param wait How long to block waiting for changes (Go duration string, e.g. 30s). Default 30s, max 2m.
     * @param git Include git status.
     * @returns ListBodyRigResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameRigs(
        cityName: string,
        index?: string,
        wait?: string,
        git?: boolean,
    ): CancelablePromise<ListBodyRigResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/rigs',
            path: {
                'cityName': cityName,
            },
            query: {
                'index': index,
                'wait': wait,
                'git': git,
            },
        });
    }
    /**
     * Create a rig
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns RigCreatedOutputBody Created
     * @throws ApiError
     */
    public static createRig(
        xGcRequest: string,
        cityName: string,
        requestBody: RigCreateInputBody,
    ): CancelablePromise<ErrorModel | RigCreatedOutputBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/rigs',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name service by name
     * @param cityName City name.
     * @param name Service name.
     * @returns Status OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameServiceByName(
        cityName: string,
        name: string,
    ): CancelablePromise<Status | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/service/{name}',
            path: {
                'cityName': cityName,
                'name': name,
            },
        });
    }
    /**
     * Post v0 city by city name service by name restart
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param name Service name.
     * @returns ServiceRestartOutputBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameServiceByNameRestart(
        xGcRequest: string,
        cityName: string,
        name: string,
    ): CancelablePromise<ServiceRestartOutputBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/service/{name}/restart',
            path: {
                'cityName': cityName,
                'name': name,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name services
     * @param cityName City name.
     * @returns ListBodyStatus OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameServices(
        cityName: string,
    ): CancelablePromise<ListBodyStatus | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/services',
            path: {
                'cityName': cityName,
            },
        });
    }
    /**
     * Get v0 city by city name session by ID
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param peek Include last output preview.
     * @param peekLines Number of lines to include in the last output preview when peek=true. Defaults to 5.
     * @returns SessionResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameSessionById(
        cityName: string,
        id: string,
        peek?: boolean,
        peekLines?: number,
    ): CancelablePromise<SessionResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/session/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
            query: {
                'peek': peek,
                'peek_lines': peekLines,
            },
        });
    }
    /**
     * Patch v0 city by city name session by ID
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param requestBody
     * @returns SessionResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static patchV0CityByCityNameSessionById(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: SessionPatchBody,
    ): CancelablePromise<SessionResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v0/city/{cityName}/session/{id}',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name session by ID agents
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @returns SessionAgentListResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameSessionByIdAgents(
        cityName: string,
        id: string,
    ): CancelablePromise<SessionAgentListResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/session/{id}/agents',
            path: {
                'cityName': cityName,
                'id': id,
            },
        });
    }
    /**
     * Get v0 city by city name session by ID agents by agent ID
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param agentId Subagent ID within the session.
     * @returns SessionAgentGetResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameSessionByIdAgentsByAgentId(
        cityName: string,
        id: string,
        agentId: string,
    ): CancelablePromise<SessionAgentGetResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/session/{id}/agents/{agentId}',
            path: {
                'cityName': cityName,
                'id': id,
                'agentId': agentId,
            },
        });
    }
    /**
     * Post v0 city by city name session by ID close
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param _delete Permanently delete bead after closing.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameSessionByIdClose(
        xGcRequest: string,
        cityName: string,
        id: string,
        _delete?: boolean,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/close',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            query: {
                'delete': _delete,
            },
        });
    }
    /**
     * Post v0 city by city name session by ID kill
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @returns OKWithIDResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameSessionByIdKill(
        xGcRequest: string,
        cityName: string,
        id: string,
    ): CancelablePromise<OKWithIDResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/kill',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Send a message to a session
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns AsyncAcceptedBody Accepted
     * @throws ApiError
     */
    public static sendSessionMessage(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: SessionMessageInputBody,
    ): CancelablePromise<ErrorModel | AsyncAcceptedBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/messages',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name session by ID pending
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @returns SessionPendingResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameSessionByIdPending(
        cityName: string,
        id: string,
    ): CancelablePromise<SessionPendingResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/session/{id}/pending',
            path: {
                'cityName': cityName,
                'id': id,
            },
        });
    }
    /**
     * Post v0 city by city name session by ID permission mode
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param requestBody
     * @returns SessionResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameSessionByIdPermissionMode(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: SessionPermissionModeBody,
    ): CancelablePromise<SessionResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/permission-mode',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name session by ID rename
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param requestBody
     * @returns SessionResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameSessionByIdRename(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: SessionRenameInputBody,
    ): CancelablePromise<SessionResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/rename',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Respond to a pending interaction
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns SessionRespondOutputBody Accepted
     * @throws ApiError
     */
    public static respondSession(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: SessionRespondInputBody,
    ): CancelablePromise<ErrorModel | SessionRespondOutputBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/respond',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name session by ID stop
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @returns OKWithIDResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameSessionByIdStop(
        xGcRequest: string,
        cityName: string,
        id: string,
    ): CancelablePromise<OKWithIDResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/stop',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Stream session output in real time
     * Server-Sent Events stream of session transcript updates. Streams turns (conversation format) or raw messages (JSONL format) based on the format query parameter. Emits activity and pending events for tool approval prompts.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param format Transcript format: conversation (default) or raw.
     * @returns any OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static streamSession(
        cityName: string,
        id: string,
        format?: string,
    ): CancelablePromise<Array<({
        data: SessionActivityEvent;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    } | {
        data: HeartbeatEvent;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    } | {
        data: SessionStreamRawMessageEvent;
        /**
         * The event name.
         */
        event?: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    } | {
        data: PendingInteraction;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    } | {
        data: SessionStreamMessageEvent;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID.
         */
        id?: number;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    })> | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/session/{id}/stream',
            path: {
                'cityName': cityName,
                'id': id,
            },
            query: {
                'format': format,
            },
        });
    }
    /**
     * Submit a message to a session
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns AsyncAcceptedBody Accepted
     * @throws ApiError
     */
    public static submitSession(
        xGcRequest: string,
        cityName: string,
        id: string,
        requestBody: SessionSubmitInputBody,
    ): CancelablePromise<ErrorModel | AsyncAcceptedBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/submit',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name session by ID suspend
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @returns OKResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameSessionByIdSuspend(
        xGcRequest: string,
        cityName: string,
        id: string,
    ): CancelablePromise<OKResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/suspend',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name session by ID transcript
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @param tail Number of recent compaction segments to return. This API parameter keeps compaction-segment semantics even though gc session logs --tail counts displayed transcript entries. Omit for the endpoint default (usually 1); 0 returns all segments; N>0 returns the last N.
     * @param format Transcript format: conversation (default) or raw.
     * @param before Pagination cursor: return entries before this UUID.
     * @param after Pagination cursor: return entries after this UUID.
     * @returns SessionTranscriptGetResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameSessionByIdTranscript(
        cityName: string,
        id: string,
        tail?: string,
        format?: string,
        before?: string,
        after?: string,
    ): CancelablePromise<SessionTranscriptGetResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/session/{id}/transcript',
            path: {
                'cityName': cityName,
                'id': id,
            },
            query: {
                'tail': tail,
                'format': format,
                'before': before,
                'after': after,
            },
        });
    }
    /**
     * Post v0 city by city name session by ID wake
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param id Session ID, alias, or runtime session_name.
     * @returns OKWithIDResponseBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameSessionByIdWake(
        xGcRequest: string,
        cityName: string,
        id: string,
    ): CancelablePromise<OKWithIDResponseBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/session/{id}/wake',
            path: {
                'cityName': cityName,
                'id': id,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Get v0 city by city name sessions
     * @param cityName City name.
     * @param cursor Pagination cursor from a previous response's next_cursor field.
     * @param limit Maximum number of results to return. 0 = server default.
     * @param state Filter by session state (e.g. active, closed).
     * @param template Filter by session template (agent qualified name).
     * @param peek Include last output preview.
     * @returns ListBodySessionResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameSessions(
        cityName: string,
        cursor?: string,
        limit?: number,
        state?: string,
        template?: string,
        peek?: boolean,
    ): CancelablePromise<ListBodySessionResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/sessions',
            path: {
                'cityName': cityName,
            },
            query: {
                'cursor': cursor,
                'limit': limit,
                'state': state,
                'template': template,
                'peek': peek,
            },
        });
    }
    /**
     * Create a session
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns ErrorModel Error
     * @returns AsyncAcceptedBody Accepted
     * @throws ApiError
     */
    public static createSession(
        xGcRequest: string,
        cityName: string,
        requestBody: SessionCreateBody,
    ): CancelablePromise<ErrorModel | AsyncAcceptedBody> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/sessions',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Post v0 city by city name sling
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param requestBody
     * @returns SlingResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static postV0CityByCityNameSling(
        xGcRequest: string,
        cityName: string,
        requestBody: SlingInputBody,
    ): CancelablePromise<SlingResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/sling',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get v0 city by city name status
     * @param cityName City name.
     * @param index Event sequence number; when provided, blocks until a newer event arrives.
     * @param wait How long to block waiting for changes (Go duration string, e.g. 30s). Default 30s, max 2m.
     * @param lite When true, omit the expensive store-health, session-count, and work-count blocks for low-cost dashboard polls.
     * @returns StatusBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameStatus(
        cityName: string,
        index?: string,
        wait?: string,
        lite?: boolean,
    ): CancelablePromise<StatusBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/status',
            path: {
                'cityName': cityName,
            },
            query: {
                'index': index,
                'wait': wait,
                'lite': lite,
            },
        });
    }
    /**
     * Post v0 city by city name unregister
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName Supervisor-registered city name.
     * @returns ErrorModel Error
     * @returns AsyncAcceptedResponse Accepted
     * @throws ApiError
     */
    public static postV0CityByCityNameUnregister(
        xGcRequest: string,
        cityName: string,
    ): CancelablePromise<ErrorModel | AsyncAcceptedResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v0/city/{cityName}/unregister',
            path: {
                'cityName': cityName,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
        });
    }
    /**
     * Delete v0 city by city name workflow by workflow ID
     * @param xGcRequest Anti-CSRF header required on mutation requests. Any non-empty value is accepted; the header's presence is what the server checks.
     * @param cityName City name.
     * @param workflowId Workflow (convoy) ID.
     * @param scopeKind Scope kind (city or rig).
     * @param scopeRef Scope reference.
     * @param _delete Permanently delete beads from store.
     * @returns WorkflowDeleteResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static deleteV0CityByCityNameWorkflowByWorkflowId(
        xGcRequest: string,
        cityName: string,
        workflowId: string,
        scopeKind?: string,
        scopeRef?: string,
        _delete?: boolean,
    ): CancelablePromise<WorkflowDeleteResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v0/city/{cityName}/workflow/{workflow_id}',
            path: {
                'cityName': cityName,
                'workflow_id': workflowId,
            },
            headers: {
                'X-GC-Request': xGcRequest,
            },
            query: {
                'scope_kind': scopeKind,
                'scope_ref': scopeRef,
                'delete': _delete,
            },
        });
    }
    /**
     * Get v0 city by city name workflow by workflow ID
     * @param cityName City name.
     * @param workflowId Workflow (convoy) ID.
     * @param scopeKind Scope kind (city or rig).
     * @param scopeRef Scope reference.
     * @returns WorkflowSnapshotResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0CityByCityNameWorkflowByWorkflowId(
        cityName: string,
        workflowId: string,
        scopeKind?: string,
        scopeRef?: string,
    ): CancelablePromise<WorkflowSnapshotResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/city/{cityName}/workflow/{workflow_id}',
            path: {
                'cityName': cityName,
                'workflow_id': workflowId,
            },
            query: {
                'scope_kind': scopeKind,
                'scope_ref': scopeRef,
            },
        });
    }
    /**
     * Get v0 events
     * @param type Filter by event type.
     * @param actor Filter by actor.
     * @param since Filter to events within the last Go duration (e.g. "5m").
     * @param limit Maximum number of trailing events to return. 0 = no limit. Used by 'gc events --seq' to compute the head cursor cheaply.
     * @returns SupervisorEventListOutputBody OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0Events(
        type?: string,
        actor?: string,
        since?: string,
        limit?: number,
    ): CancelablePromise<SupervisorEventListOutputBody | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/events',
            query: {
                'type': type,
                'actor': actor,
                'since': since,
                'limit': limit,
            },
        });
    }
    /**
     * Stream tagged events from all running cities.
     * Server-Sent Events stream of supervisor-tagged events. Supports reconnection via Last-Event-ID header or after_cursor query param; omitting both starts at the current supervisor event head.
     * @param lastEventId Reconnect cursor (composite per-city cursor). Omit Last-Event-ID and after_cursor to start at the current supervisor event head.
     * @param afterCursor Alternative to Last-Event-ID for browsers that can't set custom headers. Omit after_cursor and Last-Event-ID to start at the current supervisor event head.
     * @returns any OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static streamSupervisorEvents(
        lastEventId?: string,
        afterCursor?: string,
    ): CancelablePromise<Array<({
        data: HeartbeatEvent;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID (composite cursor).
         */
        id?: string;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    } | {
        data: TypedTaggedEventStreamEnvelope;
        /**
         * The event name.
         */
        event: string;
        /**
         * The event ID (composite cursor).
         */
        id?: string;
        /**
         * The retry time in milliseconds.
         */
        retry?: number;
    })> | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/events/stream',
            headers: {
                'Last-Event-ID': lastEventId,
            },
            query: {
                'after_cursor': afterCursor,
            },
        });
    }
    /**
     * Get v0 provider readiness
     * @param providers Comma-separated list of providers to probe.
     * @param fresh Force fresh probe, bypassing cache.
     * @returns ProviderReadinessResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0ProviderReadiness(
        providers?: string,
        fresh?: boolean,
    ): CancelablePromise<ProviderReadinessResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/provider-readiness',
            query: {
                'providers': providers,
                'fresh': fresh,
            },
        });
    }
    /**
     * Get v0 readiness
     * @param items Comma-separated list of readiness items to check.
     * @param fresh Force fresh probe, bypassing cache.
     * @returns ReadinessResponse OK
     * @returns ErrorModel Error
     * @throws ApiError
     */
    public static getV0Readiness(
        items?: string,
        fresh?: boolean,
    ): CancelablePromise<ReadinessResponse | ErrorModel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v0/readiness',
            query: {
                'items': items,
                'fresh': fresh,
            },
        });
    }
}
