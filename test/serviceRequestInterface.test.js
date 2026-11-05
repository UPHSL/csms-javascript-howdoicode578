import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";

import { createApp } from "../src/app.js";

import { Resident } from "../src/models/Resident.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";

import { ServiceRequest } from "../src/models/ServiceRequest.js";
import { ServiceRequestRepository } from "../src/repositories/ServiceRequestRepository.js";

describe("T13 - Service Request Management Interface Integration Tests", () => {
  let app;
  let database;
  let residentRepository;
  let serviceRequestRepository;
  let temporaryDirectory;

  const sampleResident = {
    firstName: "Juan",
    lastName: "Dela Cruz",
    address: "Barangay Santo Tomas",
    contactNumber: "09171234567",
    email: "juan@example.com",
    status: "Active"
  };

  const sampleRequest = {
    residentId: 1,
    serviceType: "Barangay Clearance",
    description: "Request for employment requirement",
    dateRequested: "2026-10-03",
    status: "Pending"
  };

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "csms-t13-")
    );

    const databasePath = path.join(
      temporaryDirectory,
      "residents.db"
    );

    app = createApp({ databasePath });

    database = app.locals.database;

    residentRepository =
      new ResidentRepository(database);

    serviceRequestRepository =
      new ServiceRequestRepository(database);
  });

  afterEach(() => {
    if (database) {
      database.close();
    }

    if (temporaryDirectory) {
      fs.rmSync(temporaryDirectory, {
        recursive: true,
        force: true
      });
    }
  });

  function persistResident(overrides = {}) {
    return residentRepository.save(
      new Resident({
        ...sampleResident,
        ...overrides
      })
    );
  }

  function persistRequest(overrides = {}) {
    return serviceRequestRepository.save(
      new ServiceRequest({
        ...sampleRequest,
        ...overrides
      })
    );
  }

  function submitValidRequest(overrides = {}) {
    const resident = persistResident();

    return request(app)
      .post("/service-requests")
      .type("form")
      .send({
        residentId: resident.id,
        serviceType: "Barangay Clearance",
        description: "Request for employment requirement",
        dateRequested: "2026-10-03",
        ...overrides
      });
  }

  it("Test 1 - Service Request Management Page Loads", async () => {
    const response = await request(app)
      .get("/service-requests");

    assert.equal(response.status, 200);
    assert.match(response.text, /Service Request Management/);
    assert.match(response.text, /Submit Service Request/);
  });

  it("Test 2 - Empty Listing Displays an Appropriate Message", async () => {
    const response = await request(app)
      .get("/service-requests");

    assert.equal(response.status, 200);
    assert.match(response.text, /No Service Requests found/);
  });

  it("Test 3 - Listing Displays Persisted Service Requests", async () => {
    persistRequest();

    const response = await request(app)
      .get("/service-requests");

    assert.equal(response.status, 200);
    assert.match(response.text, /Barangay Clearance/);
    assert.match(response.text, /Request for employment requirement/);
    assert.match(response.text, /Pending/);
  });

  it("Test 4 - Search Uses Existing Service Request Search Behavior", async () => {
    persistRequest({
      serviceType: "Barangay Clearance"
    });

    persistRequest({
      residentId: 2,
      serviceType: "Business Permit",
      description: "Business registration"
    });

    const response = await request(app)
      .get("/service-requests")
      .query({ search: "CLEAR" });

    assert.equal(response.status, 200);
    assert.match(response.text, /Barangay Clearance/);
    assert.doesNotMatch(response.text, /Business Permit/);
    assert.match(response.text, /value="CLEAR"/);
  });

  it("Test 5 - Status Filter Displays Only Matching Requests", async () => {
    persistRequest({ status: "Pending" });

    persistRequest({
      residentId: 2,
      status: "Completed"
    });

    const response = await request(app)
      .get("/service-requests")
      .query({ status: "Pending" });

    assert.equal(response.status, 200);
    assert.match(response.text, /Pending/);
    assert.match(response.text, /Request for employment requirement/);
    assert.doesNotMatch(response.text, /Completed Request Description/);
    assert.match(response.text, /value="Pending"/);
  });

  it("Test 6 - Combined Search and Status Filter Are Applied", async () => {
    persistRequest({
      serviceType: "Barangay Clearance",
      status: "Pending"
    });

    persistRequest({
      residentId: 2,
      serviceType: "Barangay Clearance",
      status: "Completed"
    });

    persistRequest({
      residentId: 3,
      serviceType: "Business Permit",
      status: "Pending"
    });

    const response = await request(app)
      .get("/service-requests")
      .query({
        search: "clearance",
        status: "Pending"
      });

    assert.equal(response.status, 200);
    assert.match(response.text, /Barangay Clearance/);
    assert.doesNotMatch(response.text, /Business Permit/);
    assert.match(response.text, /value="clearance"/);
  });

  it("Test 7 - No Matching Search Results Display an Empty Message", async () => {
    persistRequest();

    const response = await request(app)
      .get("/service-requests")
      .query({ search: "nonexistent" });

    assert.equal(response.status, 200);
    assert.match(response.text, /No Service Requests found/);
  });

  it("Test 8 - Submission Form Contains Required Fields", async () => {
    const response = await request(app)
      .get("/service-requests/new");

    assert.equal(response.status, 200);

    for (const field of [
      "residentId",
      "serviceType",
      "description",
      "dateRequested"
    ]) {
      assert.match(
        response.text,
        new RegExp(`name="${field}"`)
      );
    }

    assert.doesNotMatch(response.text, /name="status"/);
    assert.doesNotMatch(response.text, /name="id"/);
  });

  it("Test 9 - Valid Submission Persists a Pending Service Request", async () => {
    const response = await submitValidRequest();

    assert.equal(response.status, 302);
    assert.match(response.headers.location, /\/service-requests/);

    const requests = serviceRequestRepository.findAll();

    assert.equal(requests.length, 1);
    assert.ok(requests[0].id);
    assert.equal(requests[0].status, "Pending");
    assert.equal(requests[0].serviceType, "Barangay Clearance");
  });

  it("Test 10 - Submitted Request Receives a Generated ID", async () => {
    const response = await submitValidRequest();

    assert.equal(response.status, 302);

    const saved = serviceRequestRepository.findAll();

    assert.equal(saved.length, 1);
    assert.equal(typeof saved[0].id, "number");
    assert.ok(saved[0].id > 0);
  });

  it("Test 11 - Invalid Submission Displays Errors and Does Not Persist", async () => {
    const resident = persistResident();

    const response = await request(app)
      .post("/service-requests")
      .type("form")
      .send({
        residentId: resident.id,
        serviceType: "",
        description: "",
        dateRequested: "invalid-date"
      });

    assert.equal(response.status, 400);
    assert.match(response.text, /Service type is required/i);
    assert.equal(serviceRequestRepository.count(), 0);
  });

  it("Test 12 - Nonexistent Resident Cannot Submit a Request", async () => {
    const response = await request(app)
      .post("/service-requests")
      .type("form")
      .send({
        residentId: 999999,
        serviceType: "Barangay Clearance",
        description: "Employment requirement",
        dateRequested: "2026-10-03"
      });

    assert.equal(response.status, 400);
    assert.match(response.text, /Resident not found/i);
    assert.equal(serviceRequestRepository.count(), 0);
  });

  it("Test 13 - Inactive Resident Cannot Submit a Request", async () => {
    const resident = persistResident({
      status: "Inactive"
    });

    const response = await request(app)
      .post("/service-requests")
      .type("form")
      .send({
        residentId: resident.id,
        serviceType: "Barangay Clearance",
        description: "Employment requirement",
        dateRequested: "2026-10-03"
      });

    assert.equal(response.status, 400);
    assert.match(response.text, /inactive/i);
    assert.equal(serviceRequestRepository.count(), 0);
  });

  it("Test 14 - Submission Preserves Form Values After Validation Failure", async () => {
    const resident = persistResident();

    const response = await request(app)
      .post("/service-requests")
      .type("form")
      .send({
        residentId: resident.id,
        serviceType: "",
        description: "Employment requirement",
        dateRequested: "2026-10-03"
      });

    assert.equal(response.status, 400);
    assert.match(response.text, /Employment requirement/);
    assert.match(response.text, /2026-10-03/);
  });

  it("Test 15 - Service Request Details Page Displays Complete Information", async () => {
    const saved = persistRequest({
      residentId: 25,
      serviceType: "Certificate of Residency",
      description: "Needed for school enrollment",
      dateRequested: "2026-10-10",
      status: "In Progress"
    });

    const response = await request(app)
      .get(`/service-requests/${saved.id}`);

    assert.equal(response.status, 200);
    assert.match(response.text, /Certificate of Residency/);
    assert.match(response.text, /Needed for school enrollment/);
    assert.match(response.text, /2026-10-10/);
    assert.match(response.text, /In Progress/);
    assert.match(response.text, /25/);
  });

  it("Test 16 - Unknown Service Request ID Returns 404", async () => {
    const beforeCount = serviceRequestRepository.count();

    const response = await request(app)
      .get("/service-requests/999999");

    assert.equal(response.status, 404);
    assert.match(response.text, /Service Request Not Found/i);
    assert.equal(serviceRequestRepository.count(), beforeCount);
  });

  it("Test 17 - Invalid Service Request ID Returns 404", async () => {
    const response = await request(app)
      .get("/service-requests/invalid");

    assert.equal(response.status, 404);
  });

  it("Test 18 - Pending Request Can Start Processing", async () => {
    const saved = persistRequest();

    const response = await request(app)
      .post(`/service-requests/${saved.id}/start`);

    assert.equal(response.status, 302);

    const updated = serviceRequestRepository.findById(saved.id);

    assert.equal(updated.status, "In Progress");
  });

  it("Test 19 - Pending Request Can Be Cancelled", async () => {
    const saved = persistRequest();

    const response = await request(app)
      .post(`/service-requests/${saved.id}/cancel`);

    assert.equal(response.status, 302);

    const updated = serviceRequestRepository.findById(saved.id);

    assert.equal(updated.status, "Cancelled");
  });

  it("Test 20 - In Progress Request Can Be Completed", async () => {
    const saved = persistRequest({
      status: "In Progress"
    });

    const response = await request(app)
      .post(`/service-requests/${saved.id}/complete`);

    assert.equal(response.status, 302);

    const updated = serviceRequestRepository.findById(saved.id);

    assert.equal(updated.status, "Completed");
  });

  it("Test 21 - In Progress Request Can Be Cancelled", async () => {
    const saved = persistRequest({
      status: "In Progress"
    });

    const response = await request(app)
      .post(`/service-requests/${saved.id}/cancel`);

    assert.equal(response.status, 302);

    const updated = serviceRequestRepository.findById(saved.id);

    assert.equal(updated.status, "Cancelled");
  });

  it("Test 22 - Completed Request Does Not Display Workflow Actions", async () => {
    const saved = persistRequest({
      status: "Completed"
    });

    const response = await request(app)
      .get(`/service-requests/${saved.id}`);

    assert.equal(response.status, 200);
    assert.match(response.text, /terminal status/i);
    assert.doesNotMatch(response.text, /Complete Request/);
    assert.doesNotMatch(response.text, /Cancel Request/);
  });

  it("Test 23 - Cancelled Request Does Not Display Workflow Actions", async () => {
    const saved = persistRequest({
      status: "Cancelled"
    });

    const response = await request(app)
      .get(`/service-requests/${saved.id}`);

    assert.equal(response.status, 200);
    assert.match(response.text, /terminal status/i);
    assert.doesNotMatch(response.text, /Start Processing/);
    assert.doesNotMatch(response.text, /Cancel Request/);
  });

  it("Test 24 - Invalid Direct Transition Is Rejected", async () => {
    const saved = persistRequest({
      status: "Pending"
    });

    const response = await request(app)
      .post(`/service-requests/${saved.id}/complete`);

    assert.equal(response.status, 302);

    const unchanged = serviceRequestRepository.findById(saved.id);

    assert.equal(unchanged.status, "Pending");
  });

  it("Test 25 - Successful Status Change Preserves Other Request Information", async () => {
    const saved = persistRequest({
      residentId: 42,
      serviceType: "Certificate of Residency",
      description: "Needed for college enrollment",
      dateRequested: "2026-10-15",
      status: "Pending"
    });

    const response = await request(app)
      .post(`/service-requests/${saved.id}/start`);

    assert.equal(response.status, 302);

    const updated = serviceRequestRepository.findById(saved.id);

    assert.equal(updated.id, saved.id);
    assert.equal(updated.residentId, 42);
    assert.equal(updated.serviceType, "Certificate of Residency");
    assert.equal(updated.description, "Needed for college enrollment");
    assert.equal(updated.dateRequested, "2026-10-15");
    assert.equal(updated.status, "In Progress");
  });

  it("Test 26 - GET Requests Do Not Change Service Request Status", async () => {
    const saved = persistRequest();

    const listing = await request(app)
      .get("/service-requests");

    const details = await request(app)
      .get(`/service-requests/${saved.id}`);

    assert.equal(listing.status, 200);
    assert.equal(details.status, 200);

    const unchanged = serviceRequestRepository.findById(saved.id);

    assert.equal(unchanged.status, "Pending");
  });
});