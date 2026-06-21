/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PoolOverride } from './PoolOverride';
export type AgentPatch = {
    AppendFragments: any[] | null;
    Args: any[] | null;
    Attach: boolean | null;
    DefaultSlingFormula: string | null;
    DependsOn: any[] | null;
    Dir: string;
    Env: Record<string, string>;
    EnvRemove: any[] | null;
    HooksInstalled: boolean | null;
    IdleTimeout: string | null;
    InjectAssignedSkills: boolean | null;
    InjectFragments: any[] | null;
    InjectFragmentsAppend: any[] | null;
    InstallAgentHooks: any[] | null;
    InstallAgentHooksAppend: any[] | null;
    Lifecycle: string | null;
    MCP: any[] | null;
    MCPAppend: any[] | null;
    MaxActiveSessions: number | null;
    MaxSessionAge: string | null;
    MaxSessionAgeJitter: string | null;
    MinActiveSessions: number | null;
    MouseMode: string | null;
    Name: string;
    Nudge: string | null;
    OptionDefaults: Record<string, string>;
    OverlayDir: string | null;
    Pool: PoolOverride;
    PreStart: any[] | null;
    PreStartAppend: any[] | null;
    PromptTemplate: string | null;
    Provider: string | null;
    ResumeCommand: string | null;
    ScaleCheck: string | null;
    Scope: string | null;
    Session: string | null;
    SessionLive: any[] | null;
    SessionLiveAppend: any[] | null;
    SessionSetup: any[] | null;
    SessionSetupAppend: any[] | null;
    SessionSetupScript: string | null;
    Skills: any[] | null;
    SkillsAppend: any[] | null;
    SleepAfterIdle: string | null;
    StartCommand: string | null;
    Suspended: boolean | null;
    TmuxAlias: string | null;
    WakeMode: string | null;
    WorkDir: string | null;
};

