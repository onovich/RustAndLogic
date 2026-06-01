# TapeScript Instruction Catalog

Use this file as the source of truth for TapeScript instruction changes.

How to edit:

- To rename an instruction, change `Target name`.
- To add an instruction, add a row under `Proposed New Instructions`.
- To remove or postpone an instruction, set `Status` to `remove` or `later`.
- Describe behavior in natural language first. Implementation details can stay rough.
- Keep names in PascalCase or PascalCase_with_Suffix, for example `MoveForward` or `CheckHP_Low`.

## Current Instructions

| Status | Category | Current name | Target name | Natural language behavior | Result / failure behavior | Example |
| --- | --- | --- | --- | --- | --- | --- |
| keep | Action | `MoveForward` | `MoveForward` | Move the robot one grid cell in the direction it is facing. | If the target cell is outside the map or blocked, the action fails and automatic playback should pause. | `MoveForward` |
| keep | Action | `TurnLeft` | `TurnLeft` | Rotate the robot 90 degrees counter-clockwise without moving. | Always succeeds unless the robot is unable to act. | `TurnLeft` |
| keep | Action | `TurnRight` | `TurnRight` | Rotate the robot 90 degrees clockwise without moving. | Always succeeds unless the robot is unable to act. | `TurnRight` |
| keep | Action | `PickUp` | `PickUp` | Pick up a resource from the robot's current cell or the cell directly in front of it. | If no reachable resource exists, the action fails and automatic playback should pause. | `PickUp` |
| keep | Action | `Drop` | `Drop` | Open the cargo clamp and drop carried cargo. | Currently succeeds as a placeholder. Please describe exact cargo behavior if this should become real. | `Drop` |
| keep | Action | `Fire` | `Fire` | Fire the robot's weapon relay. | Currently succeeds as a placeholder. Please describe targeting, cost, and hit behavior if this should become real. | `Fire` |
| keep | Query | `CheckScrap` | `CheckScrap` | Check whether scrap exists in the cell directly in front of the robot. | Sets the condition flag to true or false. Does not consume a physical action tick by itself. | `CheckScrap` |
| keep | Query | `CheckEnemy` | `CheckEnemy` | Check whether an enemy is currently detectable. | Sets the condition flag to true or false. Current prototype uses a deterministic placeholder. | `CheckEnemy` |
| keep | Query | `CheckHP_Low` | `CheckHP_Low` | Check whether the robot's HP is low. | Sets the condition flag to true when HP is at or below the low-health threshold. | `CheckHP_Low` |
| keep | Branch | `Jump` | `Jump` | Jump unconditionally to a label. | If the label does not exist, compilation fails. | `Jump @Loop` |
| keep | Branch | `JumpIfTrue` | `JumpIfTrue` | Jump to a label only when the condition flag is true. | If the label does not exist, compilation fails. | `JumpIfTrue @Grab` |
| keep | Branch | `JumpIfFalse` | `JumpIfFalse` | Jump to a label only when the condition flag is false. | If the label does not exist, compilation fails. | `JumpIfFalse @Patrol` |

## Language Forms

| Status | Form | Current syntax | Target syntax | Natural language behavior | Example |
| --- | --- | --- | --- | --- | --- |
| keep | Label | `@Name` | `@Name` | Define a jump target. Labels consume tape capacity like instructions. | `@Loop` |
| keep | Comment | `// text` | `// text` | Human notes ignored by the compiler. Comments do not consume tape capacity. | `// Patrol route` |

## Proposed New Instructions

Add new rows here. These are examples you can replace.

| Status | Category | Target name | Natural language behavior | Result / failure behavior | Example |
| --- | --- | --- | --- | --- | --- |
| later | Query | `CheckWall` | Check whether the cell directly in front of the robot is blocked by a wall or map boundary. | Sets the condition flag to true or false. | `CheckWall` |
| later | Query | `CheckCell` | Check whether a data cell exists in the cell directly in front of the robot. | Sets the condition flag to true or false. | `CheckCell` |
| later | Action | `Wait` | Spend one action tick doing nothing. | Always succeeds unless the robot is unable to act. | `Wait` |
| later | Action | `Repair` | Spend resources or energy to restore robot HP. | Fails if required resources are missing. | `Repair` |

## Implementation Notes For Codex

When this document is updated, implement the accepted rows across:

- `packages/tapescript-runtime/index.js`: instruction names, parsing, validation, labels, errors.
- `packages/game-sim/index.js`: hardware query/action behavior, step result, logs, snapshots if needed.
- `apps/web/src/main.js`: syntax highlighting, autocomplete candidates, UI text if needed.
- `scripts/test-runtime.mjs`: compiler, VM, and game simulation tests.
- `scripts/smoke-web-ui.mjs`: browser smoke coverage for visible behavior.

Do not implement rows whose `Status` is `later`, `remove`, or `question` unless the user explicitly asks for them.
