import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import { Resident } from "../src/models/Resident.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { ServiceRequest } from "../src/models/ServiceRequest.js";
import { ServiceRequestRepository } from "../src/repositories/ServiceRequestRepository.js";
import ServiceRequestSubmissionService from "../src/services/ServiceRequestSubmissionService.js";
import ServiceRequestStatusService from "../src/services/ServiceRequestStatusService.js";
import { ServiceRequestValidator } from "../src/services/ServiceRequestValidator.js";


function createTestContext() {
  const db = new DatabaseSync(":memory:");

  db.exec(`
    CREATE TABLE residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      address TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  const residentRepository =
    new ResidentRepository(db);

  const serviceRequestRepository =
    new ServiceRequestRepository(db);

  const validator =
    new ServiceRequestValidator();

  const submissionService =
    new ServiceRequestSubmissionService(
      validator,
      residentRepository,
      serviceRequestRepository
    );

  const statusService =
    new ServiceRequestStatusService(
      serviceRequestRepository
    );

  return {
    db,
    residentRepository,
    serviceRequestRepository,
    submissionService,
    statusService
  };
}


function createResident(overrides = {}) {
  return new Resident({
    firstName: "Juan",
    lastName: "Dela Cruz",
    address: "Barangay Santo Tomas",
    contactNumber: "09171234567",
    email: "juan@example.com",
    status: "Active",
    ...overrides
  });
}


function createRequest(
  residentId,
  overrides = {}
) {
  return new ServiceRequest({
    residentId,
    serviceType: "Barangay Clearance",
    description: "Request for employment requirement",
    dateRequested: "2026-10-03",
    ...overrides
  });
}


function createPersistedRequest(context) {
  const resident =
    context.residentRepository.save(
      createResident()
    );

  const result =
    context.submissionService
      .submitServiceRequest(
        createRequest(resident.id)
      );

  assert.equal(result.success, true);
  assert.equal(result.status, "SUBMITTED");
  assert.equal(
    result.serviceRequest.status,
    "Pending"
  );

  return {
    resident,
    serviceRequest: result.serviceRequest
  };
}


function moveToInProgress(
  context,
  serviceRequestId
) {
  const result =
    context.statusService.updateStatus(
      serviceRequestId,
      "In Progress"
    );

  assert.equal(result.success, true);
  assert.equal(
    result.serviceRequest.status,
    "In Progress"
  );

  return result.serviceRequest;
}


/*
 * TEST 1
 * Pending Can Move to In Progress
 */
test("T10.1 - Pending can move to In Progress", () => {
  const context = createTestContext();

  const { serviceRequest } =
    createPersistedRequest(context);

  assert.equal(
    serviceRequest.status,
    "Pending"
  );

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "In Progress"
    );

  assert.equal(result.success, true);
  assert.equal(
    result.status,
    "STATUS_UPDATED"
  );
  assert.equal(
    result.serviceRequest.status,
    "In Progress"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "In Progress"
  );

  context.db.close();
});


/*
 * TEST 2
 * Pending Can Move to Cancelled
 */
test("T10.2 - Pending can move to Cancelled", () => {
  const context = createTestContext();

  const { serviceRequest } =
    createPersistedRequest(context);

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Cancelled"
    );

  assert.equal(result.success, true);
  assert.equal(
    result.status,
    "STATUS_UPDATED"
  );
  assert.equal(
    result.serviceRequest.status,
    "Cancelled"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "Cancelled"
  );

  context.db.close();
});


/*
 * TEST 3
 * In Progress Can Move to Completed
 */
test("T10.3 - In Progress can move to Completed", () => {
  const context = createTestContext();

  const { serviceRequest } =
    createPersistedRequest(context);

  moveToInProgress(
    context,
    serviceRequest.id
  );

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Completed"
    );

  assert.equal(result.success, true);
  assert.equal(
    result.status,
    "STATUS_UPDATED"
  );
  assert.equal(
    result.serviceRequest.status,
    "Completed"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "Completed"
  );

  context.db.close();
});


/*
 * TEST 4
 * In Progress Can Move to Cancelled
 */
test("T10.4 - In Progress can move to Cancelled", () => {
  const context = createTestContext();

  const { serviceRequest } =
    createPersistedRequest(context);

  moveToInProgress(
    context,
    serviceRequest.id
  );

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Cancelled"
    );

  assert.equal(result.success, true);
  assert.equal(
    result.status,
    "STATUS_UPDATED"
  );
  assert.equal(
    result.serviceRequest.status,
    "Cancelled"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "Cancelled"
  );

  context.db.close();
});


/*
 * TEST 5
 * Pending Cannot Move Directly to Completed
 */
test("T10.5 - Pending cannot move directly to Completed", () => {
  const context = createTestContext();

  const { serviceRequest } =
    createPersistedRequest(context);

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Completed"
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "INVALID_TRANSITION"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "Pending"
  );

  context.db.close();
});


/*
 * TEST 6
 * In Progress Cannot Return to Pending
 */
test("T10.6 - In Progress cannot return to Pending", () => {
  const context = createTestContext();

  const { serviceRequest } =
    createPersistedRequest(context);

  moveToInProgress(
    context,
    serviceRequest.id
  );

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Pending"
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "INVALID_TRANSITION"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "In Progress"
  );

  context.db.close();
});


/*
 * TEST 7
 * Completed Is Terminal
 */
test("T10.7 - Completed is terminal", () => {
  const context = createTestContext();

  const { serviceRequest } =
    createPersistedRequest(context);

  moveToInProgress(
    context,
    serviceRequest.id
  );

  const completed =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Completed"
    );

  assert.equal(completed.success, true);
  assert.equal(
    completed.serviceRequest.status,
    "Completed"
  );

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Cancelled"
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "INVALID_TRANSITION"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "Completed"
  );

  context.db.close();
});


/*
 * TEST 8
 * Cancelled Is Terminal
 */
test("T10.8 - Cancelled is terminal", () => {
  const context = createTestContext();

  const { serviceRequest } =
    createPersistedRequest(context);

  const cancelled =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Cancelled"
    );

  assert.equal(cancelled.success, true);
  assert.equal(
    cancelled.serviceRequest.status,
    "Cancelled"
  );

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "In Progress"
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "INVALID_TRANSITION"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "Cancelled"
  );

  context.db.close();
});


/*
 * TEST 9
 * Unsupported Status Is Rejected
 */
test("T10.9 - Unsupported status is rejected", () => {
  const context = createTestContext();

  const { serviceRequest } =
    createPersistedRequest(context);

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Approved"
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "UNSUPPORTED_STATUS"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "Pending"
  );

  context.db.close();
});


/*
 * TEST 10
 * Nonexistent Service Request Is Handled Safely
 */
test("T10.10 - Nonexistent Service Request is handled safely", () => {
  const context = createTestContext();

  const existing =
    createPersistedRequest(context);

  const beforeCount =
    context.serviceRequestRepository.count();

  const result =
    context.statusService.updateStatus(
      999999,
      "In Progress"
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "SERVICE_REQUEST_NOT_FOUND"
  );
  assert.equal(
    result.serviceRequest,
    null
  );

  const afterCount =
    context.serviceRequestRepository.count();

  assert.equal(
    afterCount,
    beforeCount
  );

  const existingRequest =
    context.serviceRequestRepository.findById(
      existing.serviceRequest.id
    );

  assert.notEqual(
    existingRequest,
    null
  );

  assert.equal(
    existingRequest.status,
    "Pending"
  );

  context.db.close();
});


/*
 * TEST 11
 * Successful Transition Preserves Service Request Information
 */
test("T10.11 - Successful transition preserves Service Request information", () => {
  const context = createTestContext();

  const {
    resident,
    serviceRequest
  } = createPersistedRequest(context);

  const originalId =
    serviceRequest.id;

  const originalResidentId =
    serviceRequest.residentId;

  const originalServiceType =
    serviceRequest.serviceType;

  const originalDescription =
    serviceRequest.description;

  const originalDateRequested =
    serviceRequest.dateRequested;

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "In Progress"
    );

  assert.equal(result.success, true);

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.id,
    originalId
  );

  assert.equal(
    persisted.residentId,
    originalResidentId
  );

  assert.equal(
    persisted.residentId,
    resident.id
  );

  assert.equal(
    persisted.serviceType,
    originalServiceType
  );

  assert.equal(
    persisted.description,
    originalDescription
  );

  assert.equal(
    persisted.dateRequested,
    originalDateRequested
  );

  assert.equal(
    persisted.status,
    "In Progress"
  );

  context.db.close();
});


/*
 * TEST 12
 * Invalid Transition Does Not Modify Persistence
 */
test("T10.12 - Invalid transition does not modify persistence", () => {
  const context = createTestContext();

  const {
    serviceRequest
  } = createPersistedRequest(context);

  const before =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Completed"
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "INVALID_TRANSITION"
  );

  const after =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    after.status,
    before.status
  );

  assert.equal(
    after.id,
    before.id
  );

  assert.equal(
    after.residentId,
    before.residentId
  );

  assert.equal(
    after.serviceType,
    before.serviceType
  );

  assert.equal(
    after.description,
    before.description
  );

  assert.equal(
    after.dateRequested,
    before.dateRequested
  );

  context.db.close();
});


/*
 * TEST 13
 * Same-Status Request Is Rejected
 */
test("T10.13 - Same-status request is rejected", () => {
  const context = createTestContext();

  const {
    serviceRequest
  } = createPersistedRequest(context);

  assert.equal(
    serviceRequest.status,
    "Pending"
  );

  const result =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Pending"
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "SAME_STATUS"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "Pending"
  );

  context.db.close();
});


/*
 * STUDENT-DESIGNED TEST
 *
 * Multiple sequential valid transitions:
 *
 * Pending
 *   ↓
 * In Progress
 *   ↓
 * Completed
 *
 * This is different from the individual transition
 * tests because it verifies that valid transitions
 * can be performed sequentially on the same
 * persisted Service Request.
 */
test("Student-Designed - Service Request can complete a valid sequential workflow", () => {
  const context = createTestContext();

  const {
    serviceRequest
  } = createPersistedRequest(context);

  const firstTransition =
    context.statusService.updateStatus(
      serviceRequest.id,
      "In Progress"
    );

  assert.equal(
    firstTransition.success,
    true
  );

  assert.equal(
    firstTransition.serviceRequest.status,
    "In Progress"
  );

  const secondTransition =
    context.statusService.updateStatus(
      serviceRequest.id,
      "Completed"
    );

  assert.equal(
    secondTransition.success,
    true
  );

  assert.equal(
    secondTransition.serviceRequest.status,
    "Completed"
  );

  const persisted =
    context.serviceRequestRepository.findById(
      serviceRequest.id
    );

  assert.equal(
    persisted.status,
    "Completed"
  );

  context.db.close();
});