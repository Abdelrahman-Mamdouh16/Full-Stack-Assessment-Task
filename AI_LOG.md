# AI Log

This document records the use of AI assistance during the ProjectFlow assessment.

## Areas Where AI Assistance Was Used

### Code Review and Debugging

AI assistance was used to review existing implementation, identify potential authorization gaps, and reason about edge cases around task assignment and task status updates.

### Task Assignment

AI assistance was used to review the task assignment rules and help validate the expected behavior for:

- OWNER
- ADMIN
- PROJECT_MANAGER
- MEMBER
- Users outside the project

The final authorization remains enforced by the backend.

### Activity Tracking

AI assistance was used to review the task assignee activity requirements, including:

- assignee changes
- assignment and unassignment
- activity metadata
- pagination
- newest-first ordering
- avoiding N+1 user lookups

### Concurrency

AI assistance was used to identify the race condition in task numbering caused by using `countDocuments() + 1` and to review the atomic counter approach.

### Frontend UX

AI assistance was used to review frontend permission handling so that users only see or can interact with assignment actions that they are authorized to perform.

### Documentation

AI assistance was used to review and improve the assessment documentation, including the README and assessment notes.

## Validation

AI suggestions were reviewed against the existing codebase and assessment requirements before implementation. Changes were validated using the project's available typecheck, lint, and test commands where the environment allowed them.

AI assistance did not replace the application's backend authorization or validation logic.
