# Agents Guide: bottle

## Package overview

See README.md.

## Style guide

- Install exact `pnpm` modules
- Prefer iterative logic over JS callbacks like `forEach` and `reduce`
- Functions should take in keyword `args: {}` as a top level input if they have >1 argument (allows for easy specification of optional arguments)
- Arguments should be extracted on the first line of a function via `const {...} = args`
- Props for React components should be named `Props` and also be extracted the first line of the React component (`const {...} = props`)
- No default exports, just named exports
- Prefer `type` over `interface` when specifying data shapes - reserve `interface` for a interfaces that classes need to implement
- Don't do single-line logic with `if` statements (e.g. `if (bool) return A;`); always prefer `{}` for each branch of the control flow
- For simple boolean logic, prefer ternary `if` statements
- Put `styled` components below the core React component definition

## When making changes

- Run format, lint, typecheck, tests after every change that could affect the system
- When introducing changes, consider how the code will be tested - it should be testable without excess mocking
- When writing tests, make the tests purposeful
- Keep things simple when initially introducing changes - don't over-engineer upfront
