
# T15 â€“ System Hardening and Release Readiness

**Project:** Community Services Management System (CSMS)
**T15 Branch:** `feature/t15-system-hardening`
**Final Release Decision:** READY FOR T16 FINAL EXAM

---

## 1. Developer Information

| Name | Azra Raphael T. Prugalidad |
| GitHub Username | howdoicode578 |
| Technology Stack | JavaScript, Node.js v26.13.0, npm 11.20.0, Express 5, EJS 6, SQLite (`node:sqlite`), Node.js Test Runner |
| T15 Branch | `feature/t15-system-hardening` |

---

## 2. Release Candidate Baseline

The release candidate was established using the integrated CSMS application after completing T01 through T14. Before applying T15 hardening changes, the application and its existing automated tests were checked.

The baseline regression test completed successfully with **162 passing tests and zero failures**.

| Baseline Item | Status Before T15 | Evidence / Notes |
|---|---|---|
| Application startup | PASS | Application starts successfully using `npm start`. |
| `/health` | PASS | Health endpoint responds successfully. |
| Dashboard | PASS | Dashboard loads and displays system metrics. |
| Resident Management | PASS | Listing, search, registration, updating, and deactivation work correctly. |
| Service Request Management | PASS | Submission, listing, search, filtering, details, and status management work correctly. |
| Starter through T14 automated tests | PASS | Baseline regression test completed with 162 passed and 0 failed. |

**Baseline Test Command:**

npm test

**Baseline Results:**
- Total tests: 162
- Passed: 162
- Failed: 0

No baseline release-blocking test failures were identified.

---

## 3. Hardening Changes

The following table documents the meaningful hardening work performed during T15. It distinguishes actual fixes from areas that were reviewed without identifying defects.

| Area | Issue or Risk Found | Action Taken | Files Changed | Test/Evidence |
|---|---|---|---|---|
| Local Database Files | The local SQLite `data/` directory was untracked and could accidentally be committed. | Added `/data/` to `.gitignore` while preserving the existing local database directory. | `.gitignore` | `git check-ignore -v data/` confirmed that the directory is ignored. |
| Documentation Integrity | A leftover merge-conflict marker block was found in the midterm checkpoint document. | Removed the conflict markers while preserving the surrounding documentation. | `docs/midterm-checkpoint.md` | Searched for `<<<<<<<`, `=======`, and `>>>>>>>`; no conflict markers remained. |
| Package Metadata | Package metadata still identified the project as the starter template. | Updated the package name and synchronized the lockfile. | `package.json`, `package-lock.json` | Package name is now `csms-javascript-howdoicode578`. |
| Runtime Compatibility | The original Node.js engine requirement did not match the selected runtime. | Updated the Node.js engine requirement to `>=26 <27` and npm requirement to `>=11`. | `package.json`, `package-lock.json` | Verified Node.js v26.13.0 and npm 11.20.0. |
| Dependency Security | Dependencies required compatible security updates. | Applied dependency updates using `npm audit fix` without using `--force`. | `package-lock.json` and dependency metadata, if changed by npm | `npm audit` reported 0 vulnerabilities. |
| Architecture Documentation | Architecture documentation contained outdated starter-project information. | Replaced outdated content with documentation reflecting the implemented CSMS architecture. | `docs/architecture.md` | Reviewed against the current project structure. |
| Developer Documentation | The developer handbook did not accurately describe the integrated application. | Updated the handbook to reflect the current technologies and development workflow. | `docs/developer-handbook.md` | Reviewed against the implemented application. |
| Read-Only Request Safety | GET operations must not cause unintended state changes. | Reviewed existing GET routes and added an integration test comparing database snapshots before and after repeated read-only requests. | Existing route files reviewed; `test/t15SystemHardening.test.js` | T15.3 passed; existing T12, T13, and T14 GET-safety tests also passed. |
| Invalid Mutation Safety | Malformed Resident IDs and rejected Service Request mutations must not alter persisted data. | Added integration tests for malformed Resident mutation IDs and rejected Service Request mutations. | `test/t15SystemHardening.test.js` | T15.1 and T15.2 passed. |
| Persistence and Lifecycle Integrity | Repeated deactivation must not damage an already inactive Resident record. | Added a test that repeats deactivation and checks that the persisted record remains unchanged and visible. | `test/t15SystemHardening.test.js` | T15.5 passed. |
| Cross-Module Consistency | Resident and Service Request operations must remain consistent with dashboard metrics. | Added an integration test covering Resident registration, request submission, status changes, and resulting dashboard counts. | `test/t15SystemHardening.test.js` | T15.4 passed. |
| SQL Parameter Binding | Reviewed database queries for unsafe direct value interpolation. | Reviewed repository queries; existing database operations use prepared statements and bound parameters. No defect was identified in the reviewed queries. | Repository files reviewed; no change required. | Source review and successful regression tests. |
| Template Output Escaping | Reviewed EJS templates for unescaped output. | No unescaped EJS output tags were identified. No change was required. | EJS templates reviewed; no change required. | Source search for `<%-` returned no matches. |
| Debug Output and TODO Markers | Reviewed source files for unnecessary debug logging and unfinished TODO markers. | Retained the normal server startup URL message. No TODO matches were found. | `src/server.js` reviewed; no change required. | Source review and search for TODO markers. |

---

## 4. Five New T15 Hardening Tests

The five additional integration tests are implemented in:

`test/t15SystemHardening.test.js`

Each test uses an isolated temporary SQLite database to avoid depending on the developer's local application database.

### T15.1 â€“ Malformed Resident Mutation IDs Are Rejected Without Changing Persistence

**Category:** Input Validation and Mutation Safety

**What It Verifies:**

Attempts to deactivate a Resident using malformed IDs, including non-numeric, zero, negative, and decimal values, are rejected. A before-and-after persistence snapshot confirms that the existing Resident remains unchanged.

**Why It Adds Value Beyond Existing Tests:**

It adds integration-level evidence that malformed identifiers are safely handled by the HTTP interface and cannot cause unintended database modifications.

### T15.2 â€“ Rejected Service Request Mutation Does Not Modify Existing Records

**Category:** Mutation Safety and Persistence Integrity

**What It Verifies:**

A mutation attempt against a nonexistent Service Request is rejected. Existing Resident and Service Request records are compared before and after the attempt to confirm that they remain unchanged.

**Why It Adds Value Beyond Existing Tests:**

It checks the effect of a rejected HTTP mutation on broader persisted data instead of checking only the response.

### T15.3 â€“ Repeated Read-Only Requests Do Not Modify Persisted Records

**Category:** Read-Only Request Safety and Persistence Integrity

**What It Verifies:**

Repeated GET requests for the dashboard, Resident search, Service Request search, status filtering, combined search/filter, and request details do not change persisted records.

**Why It Adds Value Beyond Existing Tests:**

It provides a consolidated persistence-snapshot check across multiple read-only pages and query combinations.

### T15.4 â€“ Resident and Service Request Workflows Remain Synchronized With the Dashboard

**Category:** Workflow Integrity and Cross-Module Consistency

**What It Verifies:**

A Resident is registered, a Service Request is submitted for that Resident, and the request is moved to In Progress. The test then checks that dashboard counts reflect the persisted Resident and Service Request statuses.

**Why It Adds Value Beyond Existing Tests:**

It verifies an integrated sequence across multiple modules, including whether dashboard aggregates reflect the resulting persisted data.

### T15.5 â€“ Repeated Resident Deactivation Preserves the Existing Inactive Record

**Category:** Lifecycle Protection and Persistence Integrity

**What It Verifies:**

A Resident is deactivated, then deactivation is attempted again. The second attempt is handled safely, the stored record remains unchanged, and the inactive Resident remains visible.

**Why It Adds Value Beyond Existing Tests:**

It checks repeat-operation safety through the interface and confirms that an already inactive record is neither deleted nor unintentionally modified.

**Targeted T15 Test Command:**

node --test test/t15SystemHardening.test.js

**Results:**
- Total tests: 5
- Passed: 5
- Failed: 0

All five T15 hardening integration tests passed.

---

## 5. Full Regression Test Results

The complete test suite was executed twice consecutively after the T15 changes. Both required runs passed.

**Test Command:**

npm test

**Verified Runtime:**
- Node.js: v26.13.0
- npm: 11.20.0

| Regression Run | Total Tests | Passed | Failed | Result |
|---|---:|---:|---:|---|
| Run 1 | 167 | 167 | 0 | PASS |
| Run 2 | 167 | 167 | 0 | PASS |

**Total Passing Tests Reported by the Framework:** 167 per complete run.

An additional full regression run was also completed successfully.

| Additional Run | Total Tests | Passed | Failed | Result |
|---|---:|---:|---:|---|
| Latest Run | 167 | 167 | 0 | PASS |

### Additional Targeted Checks

| Command | Result |
|---|---|
| `node --test test/serviceRequestStatus.test.js` | 14 passed, 0 failed |
| `node --test test/t15SystemHardening.test.js` | 5 passed, 0 failed |
| `npm audit` | 0 vulnerabilities |
| `git diff --check` | No whitespace errors reported |

The results confirm that the hardening changes did not introduce regressions into the previously implemented CSMS features.

---

## 6. Manual Release Verification

The integrated application was manually checked through its interface. The following results reflect the completed verification reported for the T15 release candidate.

| Verification | Result | Notes |
|---|---|---|
| Application starts | PASS | Application starts without errors. |
| `/health` works | PASS | Health endpoint responds successfully. |
| Dashboard loads | PASS | Dashboard loads and displays metrics. |
| Resident listing/search works | PASS | Resident listing and search function correctly. |
| Valid Resident registration works | PASS | Valid Resident information is accepted and saved. |
| Invalid Resident registration is rejected | PASS | Invalid Resident information is rejected. |
| Resident update works | PASS | Existing Resident information can be updated. |
| Resident deactivation works and record remains visible | PASS | Deactivation persists and the inactive record remains visible. |
| Valid Service Request submission for Active Resident works | PASS | Valid requests can be submitted for Active Residents. |
| Missing/Inactive Resident submission is rejected | PASS | Requests for missing or inactive Residents are rejected. |
| Service Request search/filter/details work | PASS | Search, status filtering, and details pages function correctly. |
| Valid Service Request workflow works | PASS | Allowed status transitions function correctly. |
| Invalid/terminal transition is rejected | PASS | T10 and T13 automated tests verify invalid and terminal transition rejection. T10.12 also checks persistence after an invalid transition. |
| Dashboard reflects Resident/Service Request changes | PASS | Dashboard metrics reflect Resident and Service Request changes. |
| Read-only GET operations do not modify persistence | PASS | T12, T13, T14, and T15 tests verify GET behavior. T15.3 compares persisted-data snapshots. |

### Service Request Lifecycle Rules Verified

**Allowed Transitions:**

- Pending â†’ In Progress
- Pending â†’ Cancelled
- In Progress â†’ Completed
- In Progress â†’ Cancelled

**Rejected Transitions:**

- Pending â†’ Completed
- In Progress â†’ Pending
- Completed â†’ In Progress
- Completed â†’ Cancelled
- Cancelled â†’ In Progress
- Cancelled â†’ Completed
- Unsupported status transitions
- Same-status transitions

Completed and Cancelled are terminal states. Invalid transitions are rejected without changing the persisted Service Request status.

---

## 7. Repository Hygiene Review

| Review Item | Result | Notes / Cleanup |
|---|---|---|
| Debug output | REVIEWED | The normal server startup URL message in `src/server.js` was retained. No unnecessary debug output was identified. |
| Temporary files | REVIEWED | T15 integration tests use temporary databases and clean them up after execution. |
| Generated build/runtime artifacts | REVIEWED | Local runtime data is kept out of version control through the `/data/` ignore rule. |
| Accidental local database files | PASS | Added `/data/` to `.gitignore`; the local database directory was retained and is ignored by Git. |
| Commented-out abandoned code | REVIEWED | Reviewed; no specific abandoned-code defect was identified or changed. |
| Secrets/credentials | REVIEWED | No credentials were intentionally added as part of the T15 changes. |
| Broken navigation/links | PASS | Navigation among Dashboard, Residents, and Service Requests was manually verified. |
| Direct SQL parameter binding where applicable | PASS | Reviewed repository queries; prepared statements and bound parameters are used. |

### Additional Repository Cleanup

- Removed leftover merge-conflict markers from `docs/midterm-checkpoint.md`.
- Updated `docs/architecture.md` and `docs/developer-handbook.md` to reflect the implemented system.
- Updated `package.json` and `package-lock.json` to use the correct project name and runtime requirements.
- Confirmed that `git diff --check` reported no whitespace errors.
- Confirmed that `npm audit` reported zero vulnerabilities.

The local `data/` directory is intentionally retained for development. It is ignored by Git and was not deleted as part of T15.

---

## 8. Known Limitations

No known release-blocking limitations identified within the defined CSMS scope.

This statement is limited to the requirements and implemented functionality covered by T01â€“T15. It does not claim that the software is free of every possible defect or that functionality outside the defined project scope has been implemented.

---

## 9. Release Candidate Statement

# READY FOR T16 FINAL EXAM

The Community Services Management System has completed the T15 system-hardening and release-readiness activities.

The release candidate passed the reported manual release verification checks. The five new T15 hardening integration tests passed, the targeted Service Request lifecycle tests passed, and both required full regression runs completed with **167 passing tests and zero failures**. An additional full regression run also passed.

The project also passed its dependency audit with zero reported vulnerabilities. Repository hygiene improvements were completed, including excluding local database files from version control, correcting package metadata and runtime requirements, updating technical documentation, and removing a leftover merge-conflict block.

The existing Resident and Service Request workflows remain intact. The verified tests cover invalid mutations, read-only request safety, persistence integrity, lifecycle protection, and dashboard synchronization.

**Final Release Decision:** `READY FOR T16 FINAL EXAM`

**Remaining Release-Blocking Issues:** None identified within the defined CSMS scope.
