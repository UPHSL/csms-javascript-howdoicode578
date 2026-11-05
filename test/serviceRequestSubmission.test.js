import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import { Resident } from "../src/models/Resident.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { ServiceRequest } from "../src/models/ServiceRequest.js";
import { ServiceRequestValidator } from "../src/services/ServiceRequestValidator.js";
import ServiceRequestSubmissionService from "../src/services/ServiceRequestSubmissionService.js";
import { ServiceRequestRepository } from "../src/repositories/ServiceRequestRepository.js";

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

  const service =
    new ServiceRequestSubmissionService(
      validator,
      residentRepository,
      serviceRequestRepository
    );

  return {
    db,
    residentRepository,
    serviceRequestRepository,
    service
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

function createRequest(residentId, overrides = {}) {
  return new ServiceRequest({
    residentId,
    serviceType: "Barangay Clearance",
    description: "Request for employment requirement",
    dateRequested: "2026-10-03",
    ...overrides
  });
}

test("T09.1 - Valid Service Request submission succeeds", () => {
  const {
    db,
    residentRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const request =
    createRequest(resident.id);

  const result =
    service.submitServiceRequest(request);

  assert.equal(result.success, true);
  assert.equal(result.status, "SUBMITTED");
  assert.ok(result.serviceRequest.id);
  assert.equal(result.serviceRequest.status, "Pending");

  db.close();
});

test("T09.2 - Submitted Service Request receives a generated ID", () => {
  const {
    db,
    residentRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const request =
    createRequest(resident.id);

  assert.equal(request.id, null);

  const result =
    service.submitServiceRequest(request);

  assert.equal(result.success, true);
  assert.equal(typeof result.serviceRequest.id, "number");
  assert.ok(result.serviceRequest.id > 0);

  db.close();
});

test("T09.3 - Submitted Service Request is persisted and retrievable", () => {
  const {
    db,
    residentRepository,
    serviceRequestRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const result =
    service.submitServiceRequest(
      createRequest(resident.id)
    );

  const persisted =
    serviceRequestRepository.findById(
      result.serviceRequest.id
    );

  assert.notEqual(persisted, null);
  assert.equal(
    persisted.id,
    result.serviceRequest.id
  );

  db.close();
});

test("T09.4 - Submitted Service Request information is preserved", () => {
  const {
    db,
    residentRepository,
    serviceRequestRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const result =
    service.submitServiceRequest(
      createRequest(resident.id)
    );

  const persisted =
    serviceRequestRepository.findById(
      result.serviceRequest.id
    );

  assert.equal(persisted.residentId, resident.id);
  assert.equal(
    persisted.serviceType,
    "Barangay Clearance"
  );
  assert.equal(
    persisted.description,
    "Request for employment requirement"
  );
  assert.equal(
    persisted.dateRequested,
    "2026-10-03"
  );
  assert.equal(persisted.status, "Pending");

  db.close();
});

test("T09.5 - Submitted Service Request status is Pending", () => {
  const {
    db,
    residentRepository,
    serviceRequestRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const result =
    service.submitServiceRequest(
      createRequest(resident.id)
    );

  const persisted =
    serviceRequestRepository.findById(
      result.serviceRequest.id
    );

  assert.equal(persisted.status, "Pending");

  db.close();
});

test("T09.6 - Blank Service Type fails validation", () => {
  const {
    db,
    residentRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const result =
    service.submitServiceRequest(
      createRequest(resident.id, {
        serviceType: "   "
      })
    );

  assert.equal(result.success, false);
  assert.equal(result.status, "VALIDATION_FAILED");

  assert.ok(
    result.errors.some(
      (error) =>
        error.includes("Service type")
    )
  );

  db.close();
});

test("T09.7 - Blank Description fails validation", () => {
  const {
    db,
    residentRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const result =
    service.submitServiceRequest(
      createRequest(resident.id, {
        description: ""
      })
    );

  assert.equal(result.success, false);
  assert.equal(result.status, "VALIDATION_FAILED");

  assert.ok(
    result.errors.some(
      (error) =>
        error.includes("Description")
    )
  );

  db.close();
});

test("T09.8 - Invalid Request does not reach persistence", () => {
  const {
    db,
    residentRepository,
    serviceRequestRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const before =
    serviceRequestRepository.count();

  const result =
    service.submitServiceRequest(
      createRequest(resident.id, {
        serviceType: " "
      })
    );

  const after =
    serviceRequestRepository.count();

  assert.equal(result.success, false);
  assert.equal(before, 0);
  assert.equal(after, 0);

  db.close();
});

test("T09.9 - Nonexistent Resident prevents submission", () => {
  const {
    db,
    serviceRequestRepository,
    service
  } = createTestContext();

  const result =
    service.submitServiceRequest(
      createRequest(999999)
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "RESIDENT_NOT_FOUND"
  );

  assert.equal(
    serviceRequestRepository.count(),
    0
  );

  db.close();
});

test("T09.10 - Inactive Resident cannot submit a new Service Request", () => {
  const {
    db,
    residentRepository,
    serviceRequestRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(
      createResident({
        status: "Inactive"
      })
    );

  const result =
    service.submitServiceRequest(
      createRequest(resident.id)
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "RESIDENT_INACTIVE"
  );

  assert.equal(
    serviceRequestRepository.count(),
    0
  );

  assert.equal(
    residentRepository.findById(resident.id).status,
    "Inactive"
  );

  db.close();
});

test("T09.11 - Non-Pending initial status is rejected", () => {
  const {
    db,
    residentRepository,
    serviceRequestRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const result =
    service.submitServiceRequest(
      createRequest(resident.id, {
        status: "Completed"
      })
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "VALIDATION_FAILED"
  );

  assert.equal(
    serviceRequestRepository.count(),
    0
  );

  db.close();
});

test("T09.12 - Service Request persists across repository access", () => {
  const {
    db,
    residentRepository,
    serviceRequestRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const result =
    service.submitServiceRequest(
      createRequest(resident.id)
    );

  const secondRepository =
    new ServiceRequestRepository(db);

  const retrieved =
    secondRepository.findById(
      result.serviceRequest.id
    );

  assert.notEqual(retrieved, null);
  assert.equal(
    retrieved.id,
    result.serviceRequest.id
  );
  assert.equal(
    retrieved.residentId,
    resident.id
  );

  db.close();
});

test("T09.13 - Submission does not modify the Resident", () => {
  const {
    db,
    residentRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  service.submitServiceRequest(
    createRequest(resident.id)
  );

  const unchanged =
    residentRepository.findById(resident.id);

  assert.equal(unchanged.id, resident.id);
  assert.equal(unchanged.firstName, "Juan");
  assert.equal(unchanged.lastName, "Dela Cruz");
  assert.equal(
    unchanged.address,
    "Barangay Santo Tomas"
  );
  assert.equal(
    unchanged.contactNumber,
    "09171234567"
  );
  assert.equal(
    unchanged.email,
    "juan@example.com"
  );
  assert.equal(unchanged.status, "Active");

  db.close();
});

test("T09.14 - Invalid date fails validation", () => {
  const {
    db,
    residentRepository,
    service
  } = createTestContext();

  const resident =
    residentRepository.save(createResident());

  const result =
    service.submitServiceRequest(
      createRequest(resident.id, {
        dateRequested: "not-a-date"
      })
    );

  assert.equal(result.success, false);
  assert.equal(
    result.status,
    "VALIDATION_FAILED"
  );

  db.close();
});