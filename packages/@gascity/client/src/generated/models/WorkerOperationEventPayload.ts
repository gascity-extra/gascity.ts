/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WorkerOperationEventPayload = {
    /**
     * Qualified agent identity (best-effort, absent if the session has no agent_name metadata or alias).
     */
    agent_name?: string;
    /**
     * Work bead this operation is acting on (best-effort, may be absent for non-bead-scoped ops).
     */
    bead_id?: string;
    /**
     * Input tokens written into the prompt cache (best-effort, currently always absent).
     */
    cache_creation_tokens?: number;
    /**
     * Cached input tokens read (best-effort, currently always absent).
     */
    cache_read_tokens?: number;
    /**
     * Output tokens (best-effort, currently always absent).
     */
    completion_tokens?: number;
    /**
     * Estimated invocation cost in USD (best-effort, currently always absent; see #1255 for pricing seam).
     */
    cost_usd_estimate?: number;
    delivered?: boolean;
    duration_ms: number;
    error?: string;
    finished_at: string;
    /**
     * LLM invocation wall-clock latency (best-effort, currently always absent — no source).
     */
    latency_ms?: number;
    /**
     * LLM model identifier (best-effort, may be absent until follow-up wiring lands).
     */
    model?: string;
    op_id: string;
    operation: string;
    /**
     * SHA-256 of the rendered prompt (best-effort, currently always absent; #1256 follow-up).
     */
    prompt_sha?: string;
    /**
     * Non-cached input tokens (best-effort, currently always absent; treat zero as 'not measured', not 'free').
     */
    prompt_tokens?: number;
    /**
     * Template version frontmatter (best-effort, currently always absent; #1256 follow-up).
     */
    prompt_version?: string;
    provider?: string;
    queued?: boolean;
    result: string;
    /**
     * Run-root identifier for rolling this operation up to a workflow/molecule/chat run (best-effort).
     */
    run_id?: string;
    session_id?: string;
    session_name?: string;
    started_at: string;
    template?: string;
    transport?: string;
    /**
     * True when tokens were observed but no price resolved (best-effort tri-state; absent = not evaluated).
     */
    unpriced?: boolean;
};

