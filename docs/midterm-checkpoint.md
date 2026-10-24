# T10 Midterm Checkpoint - Service Request Status Management

## Section 1 - Developer Information

**Name:** `Azra Raphael T. Prugalidad`
**GitHub Username:** `howdoicode578`
**Primary Technology Stack:** JavaScript, Node.js, SQLite, Node Test Runner
**T10 Branch:** `feature/t10-service-request-status`

## Section 2 - My T10 Implementation

I implemented Service Request status management using a dedicated ServiceRequestStatusService, which is responsible for controlling the allowed status workflow. The service first retrieves the existing Service Request through ServiceRequestRepository.findById() using the provided Service Request ID. After retrieving the request, it checks the current persisted status and determines whether the requested target status is supported and allowed from the current state. Valid transitions are accepted based on the defined transition rules, while unsupported statuses, same-status requests, and invalid transitions are rejected before any database update occurs. For valid transitions, the service calls updateStatusById() in the ServiceRequestRepository, which updates only the status of the matching Service Request. The repository then retrieves the updated record using findById() so that the final persisted Service Request can be returned to the service caller. This approach ensures that invalid operations do not modify persistence and that the other Service Request information remains unchanged.

## Section 3 - My Transition Rules

The implementation supports the following valid transitions:

Pending → In Progress
Pending → Cancelled
In Progress → Completed
In Progress → Cancelled

### Pending → In Progress

This transition is allowed because a newly submitted Service Request begins in Pending and may move into active processing.

### Pending → Cancelled

This transition is allowed when a pending Service Request needs to be cancelled before processing begins.

### In Progress → Completed

This transition is allowed when work on the Service Request has been completed.

### In Progress → Cancelled

This transition is allowed when a Service Request that is already being processed must be cancelled.

### Why Pending → Completed Is Rejected

Pending → Completed is rejected because a Service Request must first move into `In Progress` before it can become `Completed`. This prevents the workflow from skipping the processing state.

### Why Completed Is Terminal

Completed is terminal because the Service Request has already finished. The implementation does not allow a completed request to return to an earlier state or move to another terminal state.

### Why Cancelled Is Terminal

Cancelled is terminal because the Service Request has already been cancelled. The implementation does not allow a cancelled request to return to `Pending` or `In Progress`, or move to another state.

### Same-Status Requests

A request to change a Service Request to its existing status is rejected with the `SAME_STATUS` result. The database is not modified when this occurs.

## Section 4 - Files I Changed

### File:

`src/repositories/ServiceRequestRepository.js`

**Purpose:**
Extended the existing Service Request persistence repository with `updateStatusById()`. This method updates only the `status` column for the specified Service Request ID and retrieves the updated record afterward.

### File:

`src/services/ServiceRequestStatusService.js`

**Purpose:**
Added the service responsible for managing the Service Request status workflow. It retrieves the existing request, checks supported statuses and transition rules, prevents invalid changes, and coordinates valid status updates.

### File:

`test/serviceRequestStatus.test.js`

**Purpose:**
Added the automated T10 test suite covering all required valid transitions, invalid transitions, terminal states, unsupported statuses, nonexistent requests, same-status requests, persistence protection, information preservation, and the student-designed test.

## Required Section 5 - Problem I Encountered

<<<<<<< HEAD
=======
One implementation problem I encountered was that the existing T09 ServiceRequestRepository could retrieve and save Service Requests but did not yet have a method for changing the persisted status. T10 required status management to operate on the real Service Request persistence rather than on temporary objects or arrays. I investigated the existing repository and found that findById() was already available and correctly mapped database rows into ServiceRequest objects, but there was no persistence operation specifically for updating status. I resolved this by extending the repository with an updateStatusById() method that performs a targeted SQL update using the Service Request ID. The method updates only the status column and then calls findById() to retrieve the final persisted record. This allowed the T10 service to enforce transition rules before persistence while keeping the database update limited to valid status changes.
>>>>>>> d968910aff79a59fd2d8f504f4335dd9a5f8c2f8

---

## Section 6 - My Student-Designed Test

### Test Name:

`Student-Designed - Service Request can complete a valid sequential workflow`

### What the Test Verifies:

The test verifies that a single persisted Service Request can successfully complete the valid sequential workflow:

Pending
↓
In Progress
↓
Completed

The test first creates and persists the Service Request through the existing T09 submission workflow. It then changes the request from Pending to In Progress to Completed. Finally, it retrieves the Service Request from the repository and verifies that its persisted status is Completed.

### Why I Added This Test:

I added this test to verify that multiple valid status transitions can be performed sequentially on the same persisted Service Request. The individual required tests verify individual transitions, while this test verifies that the complete workflow can progress through multiple states without losing the request's persisted state.

## Section 7 - Tools and References Used

**Visual Studio Code** - Used as the primary IDE for editing the project files, running tests, and reviewing changes.
**Node.js** - Used to run the JavaScript application and automated tests.
**Node.js `node:test`** - Used for the T10 automated test suite.
**SQLite / Node `node:sqlite`** - Used for Service Request persistence and targeted status updates.
**Git and GitHub** - Used for branch management, commits, pushing the T10 implementation, and pull request workflow.
**AI Assistant** - Used as a coding and implementation assistant for reviewing the T10 requirements, designing the status-management structure, and preparing the automated tests.
**T10 Midterm Examination Guide** - Used as the primary project requirement reference for supported statuses, transition rules, persistence requirements, automated tests, and checkpoint documentation.
**Existing T08/T09 project implementation** - Used as the architectural reference for the `ServiceRequest` model, Service Request persistence, submission workflow, and `findById()` behavior.