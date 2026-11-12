# CSMS v1.0.0 - Final Development Checkpoint

## 1. DEVELOPER INFORMATION

**Name: Azra Raphael T. Prugalidad**

**GitHub Username: howdoicode578**

**Technology Stack:** JavaScript, Node.js, Express.js, EJS, SQLite, and Node.js built-in test runner.

**T16 Branch:** `feature/t16-final-release`

**Final Release Version:** 1.0.0

## 2. MY FINAL RELEASE IMPLEMENTATION

I established the official CSMS release version in `package.json` and made it available through the centralized application configuration in `src/config/application.js`. This location fits the project's architecture because application-wide metadata can be maintained in one place and reused by different parts of the system. The `/health` endpoint obtains the application name and version through the shared configuration and includes them in its response. The browser interface also receives the version through the existing home controller and displays it on the landing page as `v1.0.0`. By using the package version as the source of truth, I avoided maintaining separate hardcoded release-version values in the health endpoint and browser interface. This implementation follows the project's JavaScript and Node.js conventions by using ES modules, the existing Express controller structure, and EJS templates. I also added automated tests to verify that the release information is correctly reported and displayed.

## 3. FILES I CHANGED

The following files were changed during T16:

1. **`package.json`**
   Updated the project version to `1.0.0`, establishing the official release version.

2. **`package-lock.json`**
   Updated the lockfile to keep the package metadata consistent with the project's updated version.

3. **`src/config/application.js`**
   Centralized the application identity and release metadata. The application version is obtained from `package.json`.

4. **`src/views/index.ejs`**
   Updated the browser interface to display the application release version.

5. **`test/t16FinalRelease.test.js`**
   Added final release tests covering the health endpoint, browser version display, and an integrated workflow involving multiple system responsibilities.

## 4. MY FINAL EXAMINATION TEST

**Test Name:** T16 Final Release Integration Test (`T16.3`)

**Modules/Responsibilities Covered:**
- Resident Management
- Service Request Management
- Service Request status workflow
- Database persistence
- Dashboard reporting

**Starting State:** A clean, test-controlled database containing no records from the integration test.

**Operations Performed:**
1. Registered two residents.
2. Deactivated one resident and verified the updated status.
3. Attempted to submit a Service Request for the inactive resident and verified that the system rejected the submission.
4. Submitted two Service Requests for the active resident.
5. Moved one request through Pending, In Progress, and Completed.
6. Cancelled the other request while it was Pending.
7. Searched for and viewed Service Requests.
8. Rechecked the database records and statuses to verify persistence.
9. Checked the Dashboard totals against the resulting records.

**Expected Final State:**
- Two registered residents.
- One active resident and one inactive resident.
- Two persisted Service Requests.
- One Completed request and one Cancelled request.
- No Service Request created for the inactive resident.
- Dashboard totals consistent with the persisted records.

**Why This Test Is Meaningful:**

This test provides stronger evidence than an isolated unit test because it verifies how multiple responsibilities work together in an actual application workflow. It checks that resident status affects Service Request submission, that requests follow the correct status transitions, and that the resulting records persist in the database. It also verifies that the Dashboard reports information consistent with the final records. Therefore, it provides evidence of integration and overall system behavior rather than testing only one function in isolation.

## 5. MY FINAL TECHNICAL DECISION

**Decision:**
I decided to use `package.json` as the source of the release version and expose it through the centralized application configuration.

**Alternative Considered:**
I could have hardcoded `1.0.0` separately in the health controller and browser template.

**Reason for My Decision:**
Using separate hardcoded values could cause inconsistencies if the application version changes in the future. Centralizing the version makes the application easier to maintain because the health endpoint and browser interface can use the same configured value. It also makes the release version easier to verify through automated tests.

## 6. PROBLEM OR VERIFICATION ISSUE ENCOUNTERED

**Problem:**
During the final integration test, the test initially expected an HTTP 302 redirect when submitting a Service Request for an inactive resident. However, the application returned HTTP 400.

**Cause or Investigation:**
I investigated the existing Service Request controller and confirmed that the application correctly handles an inactive resident by returning a validation response with HTTP 400. This behavior was consistent with the existing implementation and its validation requirements. The issue was with the initial test expectation, not with the application's inactive-resident protection.

**Resolution:**
I corrected the integration test to expect HTTP 400 instead of HTTP 302. I also added an assertion to verify the inactive-resident validation message and confirmed that no Service Request was created. After the correction, the T16 tests and both full regression runs passed.

## 7. FINAL REGRESSION RESULTS

**Test Command:** `npm test`

**Final Regression Run 1:** PASS â€” 170 tests passed, 0 failed, 0 skipped.

**Final Regression Run 2:** PASS â€” 170 tests passed, 0 failed, 0 skipped.

**Total Passing Tests Reported:** 170 passing tests per run; 340 passing test results across both runs.

## 8. TOOLS AND REFERENCES USED

The following tools and resources were used during T16:

- **JavaScript and Node.js documentation** â€” For understanding the language, modules, and runtime conventions.
- **Express.js documentation** â€” For understanding the application's routing and controller structure.
- **EJS documentation** â€” For implementing the release version display in the browser interface.
- **Existing CSMS repository documentation and source code** â€” For following the project's established architecture and implementation conventions.
- **Git and GitHub** â€” For branch management, version control, commits, and the final release workflow.
- **Node.js built-in test runner** â€” For executing the T16 tests and complete regression suite.
- **npm** â€” For package management, lockfile updates, and dependency auditing.
- **Visual Studio Code or the project's IDE** â€” For editing and reviewing source files.
- **ChatGPT (AI coding assistant)** â€” For implementation guidance, troubleshooting, test review, and documentation assistance.

I remain responsible for reviewing, understanding, testing, and explaining the implementation included in this final release.

## 9. FINAL RELEASE DECLARATION

**CSMS v1.0.0 - READY FOR RELEASE**