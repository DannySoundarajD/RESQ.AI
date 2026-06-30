# Security Specification: Rescue Firebase Rules TDD

## 1. Data Invariants
- **Scope Isolation:** No authenticated user can read or write documents belonging to another user. Access to any document under `/users/{userId}/...` is strictly gated by `request.auth.uid == userId`.
- **Identity Integrity:** Any document writes specifying a `userId` field must match `request.auth.uid` to prevent identity spoofing.
- **Type Safety and Bounds:**
  - Tasks must have string titles (maximum 200 characters) and boolean completed state.
  - Habits must have a non-negative streak and non-empty name.
  - Busy blocks must have a label and start/end time boundary strings.
- **Timestamp Integrity:** Any document creation/modification logs should leverage secure server-synced values where applicable.

---

## 2. The "Dirty Dozen" Payloads
Below are 12 specific payloads representing exploits, privilege escalations, and cross-tenant data leaks that our ruleset blocks:

### Identity Spoofing & Cross-Tenant Leakage
1. **Malicious Task Creation for Another User:** User `attacker_123` attempts to insert a task under `/users/victim_456/tasks/task_abc` where `userId` is set to `victim_456`.
2. **Unauthorized Reading of Sibling Data:** User `attacker_123` tries to list/get tasks of `victim_456` at `/users/victim_456/tasks/`.
3. **Impersonated Preferences Update:** User `attacker_123` tries to write API keys under `/users/victim_456/preferences/main`.

### Schema and Value Poisoning
4. **Giant ID Injection Attack:** Creating a task where document ID is 1.5MB of junk characters to cause resource exhaustion (blocked by ID size and alphanumeric format verification helpers).
5. **Junk Field Inject ("Ghost Fields"):** Creating a task with an unwhitelisted field `isPremiumDeveloper: true` to bypass payment tiers.
6. **Task with Non-Boolean Completion Status:** Writing a task with `completed: "absolutely"` instead of a proper boolean.
7. **Negative Streak Habit Injection:** Creating a habit with `streak: -9999` to corrupt user data.
8. **Malicious Time Boundary Blocks:** Writing a busy block with non-string start/end timestamps or a start timestamp that exceeds limit parameters.

### Role/RBAC Spoofing
9. **Admin Path Hijacking:** User attempts to write to a simulated `/admins` path to declare themselves as system administrators.
10. **Immutable Value Modification:** Attempting to update a task and changing the immutable field `id` or changing `userId` from `victim_456` to `attacker_123`.
11. **Unsigned-In Write Access:** Anonymous user with no auth context trying to create a user profile document at `/users/anonymous_123`.
12. **Blanket Query Scraping:** Client attempting to issue a list query without a proper user-scoping predicate (the rules block open listing of `/users`).

---

## 3. Security Assertions & Test Runner
All operations described in the "Dirty Dozen" return `PERMISSION_DENIED` under the secure fortress security schema.
The final rules file enforces strict, secure, user-level attribute-based access control.
