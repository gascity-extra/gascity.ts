/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TypedTaggedEventStreamEnvelopeBeadClaimRejected } from './TypedTaggedEventStreamEnvelopeBeadClaimRejected';
import type { TypedTaggedEventStreamEnvelopeBeadClosed } from './TypedTaggedEventStreamEnvelopeBeadClosed';
import type { TypedTaggedEventStreamEnvelopeBeadCreated } from './TypedTaggedEventStreamEnvelopeBeadCreated';
import type { TypedTaggedEventStreamEnvelopeBeadDeleted } from './TypedTaggedEventStreamEnvelopeBeadDeleted';
import type { TypedTaggedEventStreamEnvelopeBeadUpdated } from './TypedTaggedEventStreamEnvelopeBeadUpdated';
import type { TypedTaggedEventStreamEnvelopeBeadWorktreeReaped } from './TypedTaggedEventStreamEnvelopeBeadWorktreeReaped';
import type { TypedTaggedEventStreamEnvelopeBeadWorktreeReapSkipped } from './TypedTaggedEventStreamEnvelopeBeadWorktreeReapSkipped';
import type { TypedTaggedEventStreamEnvelopeCityCreated } from './TypedTaggedEventStreamEnvelopeCityCreated';
import type { TypedTaggedEventStreamEnvelopeCityResumed } from './TypedTaggedEventStreamEnvelopeCityResumed';
import type { TypedTaggedEventStreamEnvelopeCitySuspended } from './TypedTaggedEventStreamEnvelopeCitySuspended';
import type { TypedTaggedEventStreamEnvelopeCityUnregisterRequested } from './TypedTaggedEventStreamEnvelopeCityUnregisterRequested';
import type { TypedTaggedEventStreamEnvelopeControllerStarted } from './TypedTaggedEventStreamEnvelopeControllerStarted';
import type { TypedTaggedEventStreamEnvelopeControllerStopped } from './TypedTaggedEventStreamEnvelopeControllerStopped';
import type { TypedTaggedEventStreamEnvelopeConvoyClosed } from './TypedTaggedEventStreamEnvelopeConvoyClosed';
import type { TypedTaggedEventStreamEnvelopeConvoyCreated } from './TypedTaggedEventStreamEnvelopeConvoyCreated';
import type { TypedTaggedEventStreamEnvelopeCustom } from './TypedTaggedEventStreamEnvelopeCustom';
import type { TypedTaggedEventStreamEnvelopeEmergencyAcked } from './TypedTaggedEventStreamEnvelopeEmergencyAcked';
import type { TypedTaggedEventStreamEnvelopeEmergencySignaled } from './TypedTaggedEventStreamEnvelopeEmergencySignaled';
import type { TypedTaggedEventStreamEnvelopeEventsRotated } from './TypedTaggedEventStreamEnvelopeEventsRotated';
import type { TypedTaggedEventStreamEnvelopeExtmsgAdapterAdded } from './TypedTaggedEventStreamEnvelopeExtmsgAdapterAdded';
import type { TypedTaggedEventStreamEnvelopeExtmsgAdapterRemoved } from './TypedTaggedEventStreamEnvelopeExtmsgAdapterRemoved';
import type { TypedTaggedEventStreamEnvelopeExtmsgBound } from './TypedTaggedEventStreamEnvelopeExtmsgBound';
import type { TypedTaggedEventStreamEnvelopeExtmsgGroupCreated } from './TypedTaggedEventStreamEnvelopeExtmsgGroupCreated';
import type { TypedTaggedEventStreamEnvelopeExtmsgInbound } from './TypedTaggedEventStreamEnvelopeExtmsgInbound';
import type { TypedTaggedEventStreamEnvelopeExtmsgOutbound } from './TypedTaggedEventStreamEnvelopeExtmsgOutbound';
import type { TypedTaggedEventStreamEnvelopeExtmsgOutboundChannelMismatch } from './TypedTaggedEventStreamEnvelopeExtmsgOutboundChannelMismatch';
import type { TypedTaggedEventStreamEnvelopeExtmsgUnbound } from './TypedTaggedEventStreamEnvelopeExtmsgUnbound';
import type { TypedTaggedEventStreamEnvelopeGcStoreDiskCritical } from './TypedTaggedEventStreamEnvelopeGcStoreDiskCritical';
import type { TypedTaggedEventStreamEnvelopeGcStoreDiskWarn } from './TypedTaggedEventStreamEnvelopeGcStoreDiskWarn';
import type { TypedTaggedEventStreamEnvelopeGcStoreMaintenanceDone } from './TypedTaggedEventStreamEnvelopeGcStoreMaintenanceDone';
import type { TypedTaggedEventStreamEnvelopeGcStoreMaintenanceFailed } from './TypedTaggedEventStreamEnvelopeGcStoreMaintenanceFailed';
import type { TypedTaggedEventStreamEnvelopeMailArchived } from './TypedTaggedEventStreamEnvelopeMailArchived';
import type { TypedTaggedEventStreamEnvelopeMailDeleted } from './TypedTaggedEventStreamEnvelopeMailDeleted';
import type { TypedTaggedEventStreamEnvelopeMailMarkedRead } from './TypedTaggedEventStreamEnvelopeMailMarkedRead';
import type { TypedTaggedEventStreamEnvelopeMailMarkedUnread } from './TypedTaggedEventStreamEnvelopeMailMarkedUnread';
import type { TypedTaggedEventStreamEnvelopeMailRead } from './TypedTaggedEventStreamEnvelopeMailRead';
import type { TypedTaggedEventStreamEnvelopeMailReplied } from './TypedTaggedEventStreamEnvelopeMailReplied';
import type { TypedTaggedEventStreamEnvelopeMailSent } from './TypedTaggedEventStreamEnvelopeMailSent';
import type { TypedTaggedEventStreamEnvelopeOrderCompleted } from './TypedTaggedEventStreamEnvelopeOrderCompleted';
import type { TypedTaggedEventStreamEnvelopeOrderFailed } from './TypedTaggedEventStreamEnvelopeOrderFailed';
import type { TypedTaggedEventStreamEnvelopeOrderFired } from './TypedTaggedEventStreamEnvelopeOrderFired';
import type { TypedTaggedEventStreamEnvelopePgCredentialResolved } from './TypedTaggedEventStreamEnvelopePgCredentialResolved';
import type { TypedTaggedEventStreamEnvelopeProjectIdentityStamped } from './TypedTaggedEventStreamEnvelopeProjectIdentityStamped';
import type { TypedTaggedEventStreamEnvelopeProviderSwapped } from './TypedTaggedEventStreamEnvelopeProviderSwapped';
import type { TypedTaggedEventStreamEnvelopeRequestFailed } from './TypedTaggedEventStreamEnvelopeRequestFailed';
import type { TypedTaggedEventStreamEnvelopeRequestResultCityCreate } from './TypedTaggedEventStreamEnvelopeRequestResultCityCreate';
import type { TypedTaggedEventStreamEnvelopeRequestResultCityUnregister } from './TypedTaggedEventStreamEnvelopeRequestResultCityUnregister';
import type { TypedTaggedEventStreamEnvelopeRequestResultSessionCreate } from './TypedTaggedEventStreamEnvelopeRequestResultSessionCreate';
import type { TypedTaggedEventStreamEnvelopeRequestResultSessionMessage } from './TypedTaggedEventStreamEnvelopeRequestResultSessionMessage';
import type { TypedTaggedEventStreamEnvelopeRequestResultSessionSubmit } from './TypedTaggedEventStreamEnvelopeRequestResultSessionSubmit';
import type { TypedTaggedEventStreamEnvelopeSessionColdStartTimeout } from './TypedTaggedEventStreamEnvelopeSessionColdStartTimeout';
import type { TypedTaggedEventStreamEnvelopeSessionCrashed } from './TypedTaggedEventStreamEnvelopeSessionCrashed';
import type { TypedTaggedEventStreamEnvelopeSessionDrainAckedWithAssignedWork } from './TypedTaggedEventStreamEnvelopeSessionDrainAckedWithAssignedWork';
import type { TypedTaggedEventStreamEnvelopeSessionDraining } from './TypedTaggedEventStreamEnvelopeSessionDraining';
import type { TypedTaggedEventStreamEnvelopeSessionIdleKilled } from './TypedTaggedEventStreamEnvelopeSessionIdleKilled';
import type { TypedTaggedEventStreamEnvelopeSessionMaxAgeKilled } from './TypedTaggedEventStreamEnvelopeSessionMaxAgeKilled';
import type { TypedTaggedEventStreamEnvelopeSessionQuarantined } from './TypedTaggedEventStreamEnvelopeSessionQuarantined';
import type { TypedTaggedEventStreamEnvelopeSessionResetStalled } from './TypedTaggedEventStreamEnvelopeSessionResetStalled';
import type { TypedTaggedEventStreamEnvelopeSessionStopped } from './TypedTaggedEventStreamEnvelopeSessionStopped';
import type { TypedTaggedEventStreamEnvelopeSessionStranded } from './TypedTaggedEventStreamEnvelopeSessionStranded';
import type { TypedTaggedEventStreamEnvelopeSessionSuspended } from './TypedTaggedEventStreamEnvelopeSessionSuspended';
import type { TypedTaggedEventStreamEnvelopeSessionUndrained } from './TypedTaggedEventStreamEnvelopeSessionUndrained';
import type { TypedTaggedEventStreamEnvelopeSessionUpdated } from './TypedTaggedEventStreamEnvelopeSessionUpdated';
import type { TypedTaggedEventStreamEnvelopeSessionWoke } from './TypedTaggedEventStreamEnvelopeSessionWoke';
import type { TypedTaggedEventStreamEnvelopeSessionWorkQueryFailed } from './TypedTaggedEventStreamEnvelopeSessionWorkQueryFailed';
import type { TypedTaggedEventStreamEnvelopeSupervisorFsPressureSkippedTick } from './TypedTaggedEventStreamEnvelopeSupervisorFsPressureSkippedTick';
import type { TypedTaggedEventStreamEnvelopeSupervisorRequest } from './TypedTaggedEventStreamEnvelopeSupervisorRequest';
import type { TypedTaggedEventStreamEnvelopeSupervisorShutdownRequested } from './TypedTaggedEventStreamEnvelopeSupervisorShutdownRequested';
import type { TypedTaggedEventStreamEnvelopeSupervisorStarted } from './TypedTaggedEventStreamEnvelopeSupervisorStarted';
import type { TypedTaggedEventStreamEnvelopeWorkerOperation } from './TypedTaggedEventStreamEnvelopeWorkerOperation';
/**
 * Discriminated union of supervisor event stream envelopes. Each variant constrains the envelope type and payload schema together and includes the source city.
 */
export type TypedTaggedEventStreamEnvelope = (TypedTaggedEventStreamEnvelopeBeadClaimRejected | TypedTaggedEventStreamEnvelopeBeadClosed | TypedTaggedEventStreamEnvelopeBeadCreated | TypedTaggedEventStreamEnvelopeBeadDeleted | TypedTaggedEventStreamEnvelopeBeadUpdated | TypedTaggedEventStreamEnvelopeBeadWorktreeReapSkipped | TypedTaggedEventStreamEnvelopeBeadWorktreeReaped | TypedTaggedEventStreamEnvelopeCityCreated | TypedTaggedEventStreamEnvelopeCityResumed | TypedTaggedEventStreamEnvelopeCitySuspended | TypedTaggedEventStreamEnvelopeCityUnregisterRequested | TypedTaggedEventStreamEnvelopeControllerStarted | TypedTaggedEventStreamEnvelopeControllerStopped | TypedTaggedEventStreamEnvelopeConvoyClosed | TypedTaggedEventStreamEnvelopeConvoyCreated | TypedTaggedEventStreamEnvelopeEmergencyAcked | TypedTaggedEventStreamEnvelopeEmergencySignaled | TypedTaggedEventStreamEnvelopeEventsRotated | TypedTaggedEventStreamEnvelopeExtmsgAdapterAdded | TypedTaggedEventStreamEnvelopeExtmsgAdapterRemoved | TypedTaggedEventStreamEnvelopeExtmsgBound | TypedTaggedEventStreamEnvelopeExtmsgGroupCreated | TypedTaggedEventStreamEnvelopeExtmsgInbound | TypedTaggedEventStreamEnvelopeExtmsgOutbound | TypedTaggedEventStreamEnvelopeExtmsgOutboundChannelMismatch | TypedTaggedEventStreamEnvelopeExtmsgUnbound | TypedTaggedEventStreamEnvelopeGcStoreDiskCritical | TypedTaggedEventStreamEnvelopeGcStoreDiskWarn | TypedTaggedEventStreamEnvelopeGcStoreMaintenanceDone | TypedTaggedEventStreamEnvelopeGcStoreMaintenanceFailed | TypedTaggedEventStreamEnvelopeMailArchived | TypedTaggedEventStreamEnvelopeMailDeleted | TypedTaggedEventStreamEnvelopeMailMarkedRead | TypedTaggedEventStreamEnvelopeMailMarkedUnread | TypedTaggedEventStreamEnvelopeMailRead | TypedTaggedEventStreamEnvelopeMailReplied | TypedTaggedEventStreamEnvelopeMailSent | TypedTaggedEventStreamEnvelopeOrderCompleted | TypedTaggedEventStreamEnvelopeOrderFailed | TypedTaggedEventStreamEnvelopeOrderFired | TypedTaggedEventStreamEnvelopePgCredentialResolved | TypedTaggedEventStreamEnvelopeProjectIdentityStamped | TypedTaggedEventStreamEnvelopeProviderSwapped | TypedTaggedEventStreamEnvelopeRequestFailed | TypedTaggedEventStreamEnvelopeRequestResultCityCreate | TypedTaggedEventStreamEnvelopeRequestResultCityUnregister | TypedTaggedEventStreamEnvelopeRequestResultSessionCreate | TypedTaggedEventStreamEnvelopeRequestResultSessionMessage | TypedTaggedEventStreamEnvelopeRequestResultSessionSubmit | TypedTaggedEventStreamEnvelopeSessionColdStartTimeout | TypedTaggedEventStreamEnvelopeSessionCrashed | TypedTaggedEventStreamEnvelopeSessionDrainAckedWithAssignedWork | TypedTaggedEventStreamEnvelopeSessionDraining | TypedTaggedEventStreamEnvelopeSessionIdleKilled | TypedTaggedEventStreamEnvelopeSessionMaxAgeKilled | TypedTaggedEventStreamEnvelopeSessionQuarantined | TypedTaggedEventStreamEnvelopeSessionResetStalled | TypedTaggedEventStreamEnvelopeSessionStopped | TypedTaggedEventStreamEnvelopeSessionStranded | TypedTaggedEventStreamEnvelopeSessionSuspended | TypedTaggedEventStreamEnvelopeSessionUndrained | TypedTaggedEventStreamEnvelopeSessionUpdated | TypedTaggedEventStreamEnvelopeSessionWoke | TypedTaggedEventStreamEnvelopeSessionWorkQueryFailed | TypedTaggedEventStreamEnvelopeSupervisorFsPressureSkippedTick | TypedTaggedEventStreamEnvelopeSupervisorRequest | TypedTaggedEventStreamEnvelopeSupervisorShutdownRequested | TypedTaggedEventStreamEnvelopeSupervisorStarted | TypedTaggedEventStreamEnvelopeWorkerOperation | TypedTaggedEventStreamEnvelopeCustom);

