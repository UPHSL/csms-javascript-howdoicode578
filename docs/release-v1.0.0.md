# CSMS v1.0.0 Release Notes

## 1. RELEASE

**Application:** Community Services Management System
**Release:** v1.0.0
**Release Type:** Final Course Release

## 2. RELEASE SUMMARY

CSMS v1.0.0 is a web-based Community Services Management System designed to help manage resident records and community service requests. It provides Resident Management functionality for registering, viewing, searching, and deactivating residents. It also supports Service Request submission, searching, filtering, viewing, and controlled status transitions. The Dashboard provides an overview of resident and service request records, allowing users to monitor current operational information. This release includes system hardening, automated integration testing, application version identification, and final release verification.

## 3. RESIDENT MANAGEMENT CAPABILITIES

The system provides the following Resident Management capabilities:

- Register new residents with validated information.
- View the list of registered residents.
- Search residents using their names.
- View individual resident information.
- Validate resident information, including contact number and email address.
- Deactivate active residents.
- Prevent inactive residents from submitting new Service Requests.
- Preserve resident records and their statuses in the database.

## 4. SERVICE REQUEST MANAGEMENT CAPABILITIES

The system provides the following Service Request Management capabilities:

- Submit Service Requests for eligible active residents.
- Validate submitted Service Request information.
- View the list of Service Requests.
- Search requests using their service type or description.
- Filter Service Requests by status.
- View individual Service Request details.
- Perform controlled status transitions.

The Service Request workflow follows these rules:

- **Pending â†’ In Progress**
- **Pending â†’ Cancelled**
- **In Progress â†’ Completed**
- **In Progress â†’ Cancelled**

Completed and Cancelled are terminal statuses. Requests in these states cannot be moved into another status through the implemented workflow.

## 5. DASHBOARD CAPABILITIES

The Dashboard provides an overview of the system's operational information, including resident and Service Request totals. It displays resident counts by status and Service Request counts by workflow status. It also provides an overview of open requests, helping users monitor the current workload and completed or cancelled requests.

## 6. QUALITY AND HARDENING

During T15, the system underwent release-readiness and system-hardening work while maintaining the established feature scope. The existing automated tests were retained, and additional hardening tests were introduced.

During T16, the official application identity and release version were established through a centralized application configuration. The `/health` endpoint and browser interface use the configured release version instead of maintaining separate version values. A final integration test was added to verify multiple system responsibilities, including resident management, Service Request processing, status transitions, database persistence, and Dashboard results.

Final quality checks reported:

- Two successful full regression runs.
- All 170 automated tests passing in each run.
- Zero reported npm audit vulnerabilities.
- A clean `git diff --check` result.
- Successful manual application acceptance checks.

## 7. FINAL VERIFICATION

**Final Regression Run 1:** PASS â€” 170/170 tests passed.

**Final Regression Run 2:** PASS â€” 170/170 tests passed.

**Application Startup:** PASS

**/health:** PASS â€” Reports healthy status, official application name, and release version 1.0.0.

**Dashboard:** PASS

**Resident Management:** PASS

**Service Request Management:** PASS

**Final Release Version:** v1.0.0

## 8. KNOWN LIMITATIONS

No known release-blocking limitations remain within the defined CSMS v1.0.0 scope. Features outside the approved project requirements and feature scope are not included in this release.