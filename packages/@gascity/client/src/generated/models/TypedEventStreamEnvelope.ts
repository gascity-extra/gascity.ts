/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TypedEventStreamEnvelopeBeadClaimRejected } from './TypedEventStreamEnvelopeBeadClaimRejected';
import type { TypedEventStreamEnvelopeBeadClosed } from './TypedEventStreamEnvelopeBeadClosed';
import type { TypedEventStreamEnvelopeBeadCreated } from './TypedEventStreamEnvelopeBeadCreated';
import type { TypedEventStreamEnvelopeBeadDeleted } from './TypedEventStreamEnvelopeBeadDeleted';
import type { TypedEventStreamEnvelopeBeadUpdated } from './TypedEventStreamEnvelopeBeadUpdated';
import type { TypedEventStreamEnvelopeBeadWorktreeReaped } from './TypedEventStreamEnvelopeBeadWorktreeReaped';
import type { TypedEventStreamEnvelopeBeadWorktreeReapSkipped } from './TypedEventStreamEnvelopeBeadWorktreeReapSkipped';
import type { TypedEventStreamEnvelopeCityCreated } from './TypedEventStreamEnvelopeCityCreated';
import type { TypedEventStreamEnvelopeCityResumed } from './TypedEventStreamEnvelopeCityResumed';
import type { TypedEventStreamEnvelopeCitySuspended } from './TypedEventStreamEnvelopeCitySuspended';
import type { TypedEventStreamEnvelopeCityUnregisterRequested } from './TypedEventStreamEnvelopeCityUnregisterRequested';
import type { TypedEventStreamEnvelopeControllerStarted } from './TypedEventStreamEnvelopeControllerStarted';
import type { TypedEventStreamEnvelopeControllerStopped } from './TypedEventStreamEnvelopeControllerStopped';
import type { TypedEventStreamEnvelopeConvoyClosed } from './TypedEventStreamEnvelopeConvoyClosed';
import type { TypedEventStreamEnvelopeConvoyCreated } from './TypedEventStreamEnvelopeConvoyCreated';
import type { TypedEventStreamEnvelopeCustom } from './TypedEventStreamEnvelopeCustom';
import type { TypedEventStreamEnvelopeEmergencyAcked } from './TypedEventStreamEnvelopeEmergencyAcked';
import type { TypedEventStreamEnvelopeEmergencySignaled } from './TypedEventStreamEnvelopeEmergencySignaled';
import type { TypedEventStreamEnvelopeEventsRotated } from './TypedEventStreamEnvelopeEventsRotated';
import type { TypedEventStreamEnvelopeExtmsgAdapterAdded } from './TypedEventStreamEnvelopeExtmsgAdapterAdded';
import type { TypedEventStreamEnvelopeExtmsgAdapterRemoved } from './TypedEventStreamEnvelopeExtmsgAdapterRemoved';
import type { TypedEventStreamEnvelopeExtmsgBound } from './TypedEventStreamEnvelopeExtmsgBound';
import type { TypedEventStreamEnvelopeExtmsgGroupCreated } from './TypedEventStreamEnvelopeExtmsgGroupCreated';
import type { TypedEventStreamEnvelopeExtmsgInbound } from './TypedEventStreamEnvelopeExtmsgInbound';
import type { TypedEventStreamEnvelopeExtmsgOutbound } from './TypedEventStreamEnvelopeExtmsgOutbound';
import type { TypedEventStreamEnvelopeExtmsgOutboundChannelMismatch } from './TypedEventStreamEnvelopeExtmsgOutboundChannelMismatch';
import type { TypedEventStreamEnvelopeExtmsgUnbound } from './TypedEventStreamEnvelopeExtmsgUnbound';
import type { TypedEventStreamEnvelopeGcStoreDiskCritical } from './TypedEventStreamEnvelopeGcStoreDiskCritical';
import type { TypedEventStreamEnvelopeGcStoreDiskWarn } from './TypedEventStreamEnvelopeGcStoreDiskWarn';
import type { TypedEventStreamEnvelopeGcStoreMaintenanceDone } from './TypedEventStreamEnvelopeGcStoreMaintenanceDone';
import type { TypedEventStreamEnvelopeGcStoreMaintenanceFailed } from './TypedEventStreamEnvelopeGcStoreMaintenanceFailed';
import type { TypedEventStreamEnvelopeMailArchived } from './TypedEventStreamEnvelopeMailArchived';
import type { TypedEventStreamEnvelopeMailDeleted } from './TypedEventStreamEnvelopeMailDeleted';
import type { TypedEventStreamEnvelopeMailMarkedRead } from './TypedEventStreamEnvelopeMailMarkedRead';
import type { TypedEventStreamEnvelopeMailMarkedUnread } from './TypedEventStreamEnvelopeMailMarkedUnread';
import type { TypedEventStreamEnvelopeMailRead } from './TypedEventStreamEnvelopeMailRead';
import type { TypedEventStreamEnvelopeMailReplied } from './TypedEventStreamEnvelopeMailReplied';
import type { TypedEventStreamEnvelopeMailSent } from './TypedEventStreamEnvelopeMailSent';
import type { TypedEventStreamEnvelopeOrderCompleted } from './TypedEventStreamEnvelopeOrderCompleted';
import type { TypedEventStreamEnvelopeOrderFailed } from './TypedEventStreamEnvelopeOrderFailed';
import type { TypedEventStreamEnvelopeOrderFired } from './TypedEventStreamEnvelopeOrderFired';
import type { TypedEventStreamEnvelopePgCredentialResolved } from './TypedEventStreamEnvelopePgCredentialResolved';
import type { TypedEventStreamEnvelopeProjectIdentityStamped } from './TypedEventStreamEnvelopeProjectIdentityStamped';
import type { TypedEventStreamEnvelopeProviderSwapped } from './TypedEventStreamEnvelopeProviderSwapped';
import type { TypedEventStreamEnvelopeRequestFailed } from './TypedEventStreamEnvelopeRequestFailed';
import type { TypedEventStreamEnvelopeRequestResultCityCreate } from './TypedEventStreamEnvelopeRequestResultCityCreate';
import type { TypedEventStreamEnvelopeRequestResultCityUnregister } from './TypedEventStreamEnvelopeRequestResultCityUnregister';
import type { TypedEventStreamEnvelopeRequestResultSessionCreate } from './TypedEventStreamEnvelopeRequestResultSessionCreate';
import type { TypedEventStreamEnvelopeRequestResultSessionMessage } from './TypedEventStreamEnvelopeRequestResultSessionMessage';
import type { TypedEventStreamEnvelopeRequestResultSessionSubmit } from './TypedEventStreamEnvelopeRequestResultSessionSubmit';
import type { TypedEventStreamEnvelopeSessionColdStartTimeout } from './TypedEventStreamEnvelopeSessionColdStartTimeout';
import type { TypedEventStreamEnvelopeSessionCrashed } from './TypedEventStreamEnvelopeSessionCrashed';
import type { TypedEventStreamEnvelopeSessionDrainAckedWithAssignedWork } from './TypedEventStreamEnvelopeSessionDrainAckedWithAssignedWork';
import type { TypedEventStreamEnvelopeSessionDraining } from './TypedEventStreamEnvelopeSessionDraining';
import type { TypedEventStreamEnvelopeSessionIdleKilled } from './TypedEventStreamEnvelopeSessionIdleKilled';
import type { TypedEventStreamEnvelopeSessionMaxAgeKilled } from './TypedEventStreamEnvelopeSessionMaxAgeKilled';
import type { TypedEventStreamEnvelopeSessionQuarantined } from './TypedEventStreamEnvelopeSessionQuarantined';
import type { TypedEventStreamEnvelopeSessionResetStalled } from './TypedEventStreamEnvelopeSessionResetStalled';
import type { TypedEventStreamEnvelopeSessionStopped } from './TypedEventStreamEnvelopeSessionStopped';
import type { TypedEventStreamEnvelopeSessionStranded } from './TypedEventStreamEnvelopeSessionStranded';
import type { TypedEventStreamEnvelopeSessionSuspended } from './TypedEventStreamEnvelopeSessionSuspended';
import type { TypedEventStreamEnvelopeSessionUndrained } from './TypedEventStreamEnvelopeSessionUndrained';
import type { TypedEventStreamEnvelopeSessionUpdated } from './TypedEventStreamEnvelopeSessionUpdated';
import type { TypedEventStreamEnvelopeSessionWoke } from './TypedEventStreamEnvelopeSessionWoke';
import type { TypedEventStreamEnvelopeSessionWorkQueryFailed } from './TypedEventStreamEnvelopeSessionWorkQueryFailed';
import type { TypedEventStreamEnvelopeSupervisorFsPressureSkippedTick } from './TypedEventStreamEnvelopeSupervisorFsPressureSkippedTick';
import type { TypedEventStreamEnvelopeSupervisorRequest } from './TypedEventStreamEnvelopeSupervisorRequest';
import type { TypedEventStreamEnvelopeSupervisorShutdownRequested } from './TypedEventStreamEnvelopeSupervisorShutdownRequested';
import type { TypedEventStreamEnvelopeSupervisorStarted } from './TypedEventStreamEnvelopeSupervisorStarted';
import type { TypedEventStreamEnvelopeWorkerOperation } from './TypedEventStreamEnvelopeWorkerOperation';
/**
 * Discriminated union of city event stream envelopes. Each variant constrains the envelope type and payload schema together.
 */
export type TypedEventStreamEnvelope = (TypedEventStreamEnvelopeBeadClaimRejected | TypedEventStreamEnvelopeBeadClosed | TypedEventStreamEnvelopeBeadCreated | TypedEventStreamEnvelopeBeadDeleted | TypedEventStreamEnvelopeBeadUpdated | TypedEventStreamEnvelopeBeadWorktreeReapSkipped | TypedEventStreamEnvelopeBeadWorktreeReaped | TypedEventStreamEnvelopeCityCreated | TypedEventStreamEnvelopeCityResumed | TypedEventStreamEnvelopeCitySuspended | TypedEventStreamEnvelopeCityUnregisterRequested | TypedEventStreamEnvelopeControllerStarted | TypedEventStreamEnvelopeControllerStopped | TypedEventStreamEnvelopeConvoyClosed | TypedEventStreamEnvelopeConvoyCreated | TypedEventStreamEnvelopeEmergencyAcked | TypedEventStreamEnvelopeEmergencySignaled | TypedEventStreamEnvelopeEventsRotated | TypedEventStreamEnvelopeExtmsgAdapterAdded | TypedEventStreamEnvelopeExtmsgAdapterRemoved | TypedEventStreamEnvelopeExtmsgBound | TypedEventStreamEnvelopeExtmsgGroupCreated | TypedEventStreamEnvelopeExtmsgInbound | TypedEventStreamEnvelopeExtmsgOutbound | TypedEventStreamEnvelopeExtmsgOutboundChannelMismatch | TypedEventStreamEnvelopeExtmsgUnbound | TypedEventStreamEnvelopeGcStoreDiskCritical | TypedEventStreamEnvelopeGcStoreDiskWarn | TypedEventStreamEnvelopeGcStoreMaintenanceDone | TypedEventStreamEnvelopeGcStoreMaintenanceFailed | TypedEventStreamEnvelopeMailArchived | TypedEventStreamEnvelopeMailDeleted | TypedEventStreamEnvelopeMailMarkedRead | TypedEventStreamEnvelopeMailMarkedUnread | TypedEventStreamEnvelopeMailRead | TypedEventStreamEnvelopeMailReplied | TypedEventStreamEnvelopeMailSent | TypedEventStreamEnvelopeOrderCompleted | TypedEventStreamEnvelopeOrderFailed | TypedEventStreamEnvelopeOrderFired | TypedEventStreamEnvelopePgCredentialResolved | TypedEventStreamEnvelopeProjectIdentityStamped | TypedEventStreamEnvelopeProviderSwapped | TypedEventStreamEnvelopeRequestFailed | TypedEventStreamEnvelopeRequestResultCityCreate | TypedEventStreamEnvelopeRequestResultCityUnregister | TypedEventStreamEnvelopeRequestResultSessionCreate | TypedEventStreamEnvelopeRequestResultSessionMessage | TypedEventStreamEnvelopeRequestResultSessionSubmit | TypedEventStreamEnvelopeSessionColdStartTimeout | TypedEventStreamEnvelopeSessionCrashed | TypedEventStreamEnvelopeSessionDrainAckedWithAssignedWork | TypedEventStreamEnvelopeSessionDraining | TypedEventStreamEnvelopeSessionIdleKilled | TypedEventStreamEnvelopeSessionMaxAgeKilled | TypedEventStreamEnvelopeSessionQuarantined | TypedEventStreamEnvelopeSessionResetStalled | TypedEventStreamEnvelopeSessionStopped | TypedEventStreamEnvelopeSessionStranded | TypedEventStreamEnvelopeSessionSuspended | TypedEventStreamEnvelopeSessionUndrained | TypedEventStreamEnvelopeSessionUpdated | TypedEventStreamEnvelopeSessionWoke | TypedEventStreamEnvelopeSessionWorkQueryFailed | TypedEventStreamEnvelopeSupervisorFsPressureSkippedTick | TypedEventStreamEnvelopeSupervisorRequest | TypedEventStreamEnvelopeSupervisorShutdownRequested | TypedEventStreamEnvelopeSupervisorStarted | TypedEventStreamEnvelopeWorkerOperation | TypedEventStreamEnvelopeCustom);

