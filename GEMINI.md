# Antigravity (AGY) Configuration for AI-DLC Workflows

This workspace is configured to use **AI-DLC (AI-Driven Development Life Cycle)** workflows natively within Google Antigravity.

## Workflow Orchestration
- **Invocation**: When the user types `/aidlc`, `aidlc`, or requests an AI-DLC workflow, activate the `aidlc` skill (`.agents/skills/aidlc/SKILL.md`).
- **Engine Command Execution**: Run the AI-DLC CLI orchestrator using `run_command`:
  ```powershell
  aidlc engine orchestrate next <arguments>
  ```
  After completing each stage directive, report the outcome using:
  ```powershell
  aidlc engine orchestrate report --stage <stage> --result <result>
  ```

## Antigravity Pair-Programming Mapping
- **Interactive Questioning & Gates**: Use the `ask_question` tool when presenting multi-choice approval gates, decision points, and stage choices to the user.
- **Stage Execution**: Follow each directive emitted by `aidlc engine orchestrate next`. Never skip approval gates or invent state transitions without reporting them to the engine.
- **Subagents**: When an AI-DLC stage specifies a specialized agent persona (such as `aidlc-architect-agent`, `aidlc-developer-agent`, `aidlc-quality-agent`), use `invoke_subagent` or assume that role with high domain rigor.
- **Diagnostics & Status**:
  - Run `aidlc doctor` to verify workspace and environment integrity.
  - Run `aidlc engine orchestrate next --status` for real-time lifecycle status.
