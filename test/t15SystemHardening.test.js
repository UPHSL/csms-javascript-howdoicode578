
import {
  afterEach,
  beforeEach,
  describe,
  it
} from "node:test";

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


describe("T15 - System Hardening Integration Tests", () => {
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
      path.join(os.tmpdir(), "csms-t15-")
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


  function getPersistenceSnapshot() {
    return {
      residents: residentRepository.findAll(),
      serviceRequests: serviceRequestRepository.findAll()
    };
  }


  function dashboardValue(response, testId) {
    const expression = new RegExp(
      `data-testid="${testId}"[^>]*>\\s*(\\d+)\\s*<`
    );

    const match = response.text.match(expression);

    assert.ok(
      match,
      `Dashboard metric "${testId}" was not found.`
    );

    return Number(match[1]);
  }


  /*
   * TEST 1
   * Malformed Resident Mutation ID
   *
   * Verifies that malformed, zero, and negative IDs
   * cannot trigger a Resident deactivation.
   */
  it("T15.1 - Malformed Resident mutation IDs are rejected without changing persistence", async () => {
    const resident = persistResident();

    const before =
      getPersistenceSnapshot();

    for (const invalidId of [
      "invalid",
      "0",
      "-1",
      "1.5"
    ]) {
      const response = await request(app)
        .post(`/residents/${invalidId}/deactivate`);

      assert.equal(
        response.status,
        404,
        `Expected 404 for Resident ID "${invalidId}".`
      );
    }

    const after =
      getPersistenceSnapshot();

    assert.deepEqual(after, before);

    const persisted =
      residentRepository.findById(resident.id);

    assert.ok(persisted);
    assert.equal(persisted.status, "Active");
  });


  /*
   * TEST 2
   * Rejected Mutation Protects Persistence
   *
   * Verifies that a status mutation targeting a
   * nonexistent Service Request does not affect
   * existing records.
   */
  it("T15.2 - Rejected Service Request mutation does not modify existing records", async () => {
    const resident = persistResident();

    const savedRequest = persistRequest({
      residentId: resident.id
    });

    const before =
      getPersistenceSnapshot();

    const response = await request(app)
      .post("/service-requests/999999/start");

    assert.equal(response.status, 404);

    const after =
      getPersistenceSnapshot();

    assert.deepEqual(after, before);

    assert.equal(
      serviceRequestRepository.findById(savedRequest.id).status,
      "Pending"
    );

    assert.equal(
      residentRepository.findById(resident.id).status,
      "Active"
    );
  });


  /*
   * TEST 3
   * Read-Only Request Safety
   *
   * Repeatedly accesses dashboard, Resident search,
   * Service Request search/filter, and details.
   * All requests must leave persisted records unchanged.
   */
  it("T15.3 - Repeated read-only requests do not modify persisted records", async () => {
    const resident = persistResident();

    const savedRequest = persistRequest({
      residentId: resident.id,
      status: "In Progress"
    });

    const before =
      getPersistenceSnapshot();

    const responses = [
      await request(app).get("/dashboard"),

      await request(app)
        .get("/residents")
        .query({ search: "Juan" }),

      await request(app)
        .get("/service-requests")
        .query({ search: "Clearance" }),

      await request(app)
        .get("/service-requests")
        .query({ status: "In Progress" }),

      await request(app)
        .get("/service-requests")
        .query({
          search: "Clearance",
          status: "In Progress"
        }),

      await request(app)
        .get(`/service-requests/${savedRequest.id}`),

      await request(app).get("/dashboard"),

      await request(app)
        .get("/residents")
        .query({ search: "Juan" }),

      await request(app)
        .get(`/service-requests/${savedRequest.id}`)
    ];

    for (const response of responses) {
      assert.equal(
        response.status,
        200,
        "Expected every read-only request to succeed."
      );
    }

    const after =
      getPersistenceSnapshot();

    assert.deepEqual(after, before);

    assert.equal(
      residentRepository.findById(resident.id).status,
      "Active"
    );

    assert.equal(
      serviceRequestRepository.findById(savedRequest.id).status,
      "In Progress"
    );
  });


  /*
   * TEST 4
   * Cross-Feature Regression
   *
   * Registers a Resident, submits a Service Request,
   * changes its status, and verifies that the Dashboard
   * reflects the integrated application state.
   */
  it("T15.4 - Resident and Service Request workflows remain synchronized with the Dashboard", async () => {
    const registration = await request(app)
      .post("/residents")
      .type("form")
      .send({
        firstName: "Maria",
        lastName: "Santos",
        address: "Barangay Maligaya",
        contactNumber: "09987654321",
        email: "maria@example.com"
      });

    assert.equal(registration.status, 302);

    const residents =
      residentRepository.findAll();

    assert.equal(residents.length, 1);

    const resident = residents[0];

    assert.ok(resident.id);
    assert.equal(resident.status, "Active");

    const submission = await request(app)
      .post("/service-requests")
      .type("form")
      .send({
        residentId: resident.id,
        serviceType: "Certificate of Residency",
        description: "Required for school enrollment",
        dateRequested: "2026-11-10"
      });

    assert.equal(submission.status, 302);

    const requests =
      serviceRequestRepository.findAll();

    assert.equal(requests.length, 1);

    const savedRequest = requests[0];

    assert.ok(savedRequest.id);
    assert.equal(savedRequest.residentId, resident.id);
    assert.equal(savedRequest.status, "Pending");

    const startResponse = await request(app)
      .post(`/service-requests/${savedRequest.id}/start`);

    assert.equal(startResponse.status, 302);

    const persistedRequest =
      serviceRequestRepository.findById(savedRequest.id);

    assert.equal(
      persistedRequest.status,
      "In Progress"
    );

    const dashboard = await request(app)
      .get("/dashboard");

    assert.equal(dashboard.status, 200);

    assert.equal(
      dashboardValue(dashboard, "total-residents"),
      1
    );

    assert.equal(
      dashboardValue(dashboard, "active-residents"),
      1
    );

    assert.equal(
      dashboardValue(dashboard, "total-requests"),
      1
    );

    assert.equal(
      dashboardValue(dashboard, "pending-requests"),
      0
    );

    assert.equal(
      dashboardValue(dashboard, "in-progress-requests"),
      1
    );

    assert.equal(
      dashboardValue(dashboard, "open-requests"),
      1
    );
  });


  /*
   * TEST 5
   * Repeatability and Idempotent Interface Handling
   *
   * Repeatedly deactivates the same Resident through
   * the interface and verifies that the record remains
   * persisted and its final state stays unchanged.
   */
  it("T15.5 - Repeated Resident deactivation preserves the existing inactive record", async () => {
    const resident = persistResident();

    const firstResponse = await request(app)
      .post(`/residents/${resident.id}/deactivate`);

    assert.equal(firstResponse.status, 302);

    const afterFirst =
      residentRepository.findById(resident.id);

    assert.ok(afterFirst);
    assert.equal(afterFirst.status, "Inactive");

    const beforeSecond =
      getPersistenceSnapshot();

    const secondResponse = await request(app)
      .post(`/residents/${resident.id}/deactivate`);

    assert.equal(secondResponse.status, 302);

    assert.match(
      secondResponse.headers.location,
      /already%20inactive/i
    );

    const afterSecond =
      getPersistenceSnapshot();

    assert.deepEqual(afterSecond, beforeSecond);

    const listing = await request(app)
      .get("/residents")
      .query({ search: "Juan" });

    assert.equal(listing.status, 200);
    assert.match(listing.text, /Juan/);
    assert.match(listing.text, /Inactive/);

    const dashboard = await request(app)
      .get("/dashboard");

    assert.equal(dashboard.status, 200);

    assert.equal(
      dashboardValue(dashboard, "total-residents"),
      1
    );

    assert.equal(
      dashboardValue(dashboard, "active-residents"),
      0
    );

    assert.equal(
      dashboardValue(dashboard, "inactive-residents"),
      1
    );
  });
});
