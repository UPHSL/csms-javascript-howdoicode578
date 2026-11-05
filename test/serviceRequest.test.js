import test from "node:test";
import assert from "node:assert/strict";

import { ServiceRequest } from "../src/models/ServiceRequest.js";

function createServiceRequest(overrides = {}) {
  return new ServiceRequest({
    residentId: 25,
    serviceType: "Barangay Clearance",
    description: "Request for employment requirement",
    dateRequested: "2026-10-02",
    ...overrides
  });
}

test("T08.1 - Service Request can be created", () => {
  const request = createServiceRequest();

  assert.ok(request instanceof ServiceRequest);
});

test("T08.2 - Service Request information is accessible", () => {
  const request = createServiceRequest();

  assert.equal(request.residentId, 25);
  assert.equal(request.serviceType, "Barangay Clearance");
  assert.equal(
    request.description,
    "Request for employment requirement"
  );
  assert.equal(request.dateRequested, "2026-10-02");
});

test("T08.3 - Resident ID is preserved", () => {
  const request = createServiceRequest({
    residentId: 25
  });

  assert.equal(request.residentId, 25);
});

test("T08.4 - New Service Request has an unassigned ID", () => {
  const request = createServiceRequest();

  assert.equal(request.id, null);
});

test("T08.5 - New Service Request defaults to Pending", () => {
  const request = createServiceRequest();

  assert.equal(request.status, "Pending");
});

test("T08.6 - Service Request information is independent between objects", () => {
  const firstRequest = createServiceRequest({
    residentId: 25,
    serviceType: "Barangay Clearance",
    description: "Employment requirement",
    dateRequested: "2026-10-02"
  });

  const secondRequest = createServiceRequest({
    residentId: 30,
    serviceType: "Community Assistance",
    description: "Medical assistance request",
    dateRequested: "2026-10-03"
  });

  assert.equal(firstRequest.residentId, 25);
  assert.equal(
    firstRequest.serviceType,
    "Barangay Clearance"
  );
  assert.equal(
    firstRequest.description,
    "Employment requirement"
  );
  assert.equal(firstRequest.dateRequested, "2026-10-02");

  assert.equal(secondRequest.residentId, 30);
  assert.equal(
    secondRequest.serviceType,
    "Community Assistance"
  );
  assert.equal(
    secondRequest.description,
    "Medical assistance request"
  );
  assert.equal(secondRequest.dateRequested, "2026-10-03");

  assert.notEqual(firstRequest, secondRequest);
});