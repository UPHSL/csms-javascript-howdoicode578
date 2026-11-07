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

describe("T14 - CSMS Dashboard Integration Tests", () => {
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
      path.join(os.tmpdir(), "csms-t14-")
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

  it("Test 1 - Dashboard Loads Successfully", async () => {
    const response = await request(app)
      .get("/dashboard");

    assert.equal(response.status, 200);
    assert.match(response.text, /CSMS Dashboard/);
    assert.match(response.text, /Resident Summary/);
    assert.match(response.text, /Service Request Summary/);
    assert.match(response.text, /Recent Service Requests/);
  });

  it("Test 2 - Empty Dashboard Displays Zero Counts", async () => {
    const response = await request(app)
      .get("/dashboard");

    assert.equal(response.status, 200);

    for (const testId of [
      "total-residents",
      "active-residents",
      "inactive-residents",
      "total-requests",
      "pending-requests",
      "in-progress-requests",
      "completed-requests",
      "cancelled-requests",
      "open-requests"
    ]) {
      assert.equal(dashboardValue(response, testId), 0);
    }

    assert.match(
      response.text,
      /No Service Requests available/
    );
  });

  it("Test 3 - Dashboard Displays Total Resident Count", async () => {
    persistResident();
    persistResident({
      firstName: "Maria",
      lastName: "Santos",
      email: "maria@example.com"
    });

    const response = await request(app)
      .get("/dashboard");

    assert.equal(response.status, 200);
    assert.equal(
      dashboardValue(response, "total-residents"),
      2
    );
  });

  it("Test 4 - Dashboard Displays Resident Status Counts and Reconciles", async () => {
    persistResident();

    persistResident({
      firstName: "Maria",
      lastName: "Santos",
      email: "maria@example.com",
      status: "Inactive"
    });

    persistResident({
      firstName: "Pedro",
      lastName: "Reyes",
      email: "pedro@example.com"
    });

    const response = await request(app)
      .get("/dashboard");

    const total = dashboardValue(
      response,
      "total-residents"
    );

    const active = dashboardValue(
      response,
      "active-residents"
    );

    const inactive = dashboardValue(
      response,
      "inactive-residents"
    );

    assert.equal(total, 3);
    assert.equal(active, 2);
    assert.equal(inactive, 1);
    assert.equal(total, active + inactive);
  });

  it("Test 5 - Dashboard Displays Total Service Request Count", async () => {
    persistRequest();
    persistRequest({
      serviceType: "Business Permit"
    });

    const response = await request(app)
      .get("/dashboard");

    assert.equal(response.status, 200);

    assert.equal(
      dashboardValue(response, "total-requests"),
      2
    );
  });

  it("Test 6 - Dashboard Displays All Service Request Status Counts", async () => {
    persistRequest({ status: "Pending" });

    persistRequest({
      status: "In Progress"
    });

    persistRequest({
      status: "Completed"
    });

    persistRequest({
      status: "Cancelled"
    });

    const response = await request(app)
      .get("/dashboard");

    assert.equal(
      dashboardValue(response, "pending-requests"),
      1
    );

    assert.equal(
      dashboardValue(response, "in-progress-requests"),
      1
    );

    assert.equal(
      dashboardValue(response, "completed-requests"),
      1
    );

    assert.equal(
      dashboardValue(response, "cancelled-requests"),
      1
    );
  });

  it("Test 7 - Service Request Status Counts Reconcile With Total", async () => {
    persistRequest({ status: "Pending" });
    persistRequest({ status: "Pending" });

    persistRequest({
      status: "In Progress"
    });

    persistRequest({
      status: "Completed"
    });

    persistRequest({
      status: "Cancelled"
    });

    const response = await request(app)
      .get("/dashboard");

    const total = dashboardValue(
      response,
      "total-requests"
    );

    const pending = dashboardValue(
      response,
      "pending-requests"
    );

    const inProgress = dashboardValue(
      response,
      "in-progress-requests"
    );

    const completed = dashboardValue(
      response,
      "completed-requests"
    );

    const cancelled = dashboardValue(
      response,
      "cancelled-requests"
    );

    assert.equal(total, 5);

    assert.equal(
      total,
      pending + inProgress + completed + cancelled
    );
  });

  it("Test 8 - Open Requests Equal Pending Plus In Progress", async () => {
    persistRequest({ status: "Pending" });
    persistRequest({ status: "Pending" });

    persistRequest({
      status: "In Progress"
    });

    persistRequest({
      status: "Completed"
    });

    persistRequest({
      status: "Cancelled"
    });

    const response = await request(app)
      .get("/dashboard");

    const open = dashboardValue(
      response,
      "open-requests"
    );

    const pending = dashboardValue(
      response,
      "pending-requests"
    );

    const inProgress = dashboardValue(
      response,
      "in-progress-requests"
    );

    assert.equal(open, 3);
    assert.equal(open, pending + inProgress);

    assert.doesNotMatch(
      response.text,
      /status-badge[^>]*>Open</
    );
  });

  it("Test 9 - Resident Deactivation Is Reflected On Dashboard", async () => {
    const resident = persistResident();

    const before = await request(app)
      .get("/dashboard");

    assert.equal(
      dashboardValue(before, "active-residents"),
      1
    );

    const deactivation = await request(app)
      .post(`/residents/${resident.id}/deactivate`);

    assert.equal(deactivation.status, 302);

    const after = await request(app)
      .get("/dashboard");

    assert.equal(
      dashboardValue(after, "total-residents"),
      1
    );

    assert.equal(
      dashboardValue(after, "active-residents"),
      0
    );

    assert.equal(
      dashboardValue(after, "inactive-residents"),
      1
    );
  });

  it("Test 10 - Service Request Status Transition Updates Dashboard", async () => {
    const saved = persistRequest({
      status: "Pending"
    });

    const before = await request(app)
      .get("/dashboard");

    assert.equal(
      dashboardValue(before, "pending-requests"),
      1
    );

    assert.equal(
      dashboardValue(before, "open-requests"),
      1
    );

    const transition = await request(app)
      .post(`/service-requests/${saved.id}/start`);

    assert.equal(transition.status, 302);

    const after = await request(app)
      .get("/dashboard");

    assert.equal(
      dashboardValue(after, "pending-requests"),
      0
    );

    assert.equal(
      dashboardValue(after, "in-progress-requests"),
      1
    );

    assert.equal(
      dashboardValue(after, "open-requests"),
      1
    );
  });

  it("Test 11 - Completing a Request Removes It From Open Count Without Changing Total", async () => {
    const saved = persistRequest({
      status: "In Progress"
    });

    const before = await request(app)
      .get("/dashboard");

    assert.equal(
      dashboardValue(before, "total-requests"),
      1
    );

    assert.equal(
      dashboardValue(before, "open-requests"),
      1
    );

    const transition = await request(app)
      .post(`/service-requests/${saved.id}/complete`);

    assert.equal(transition.status, 302);

    const after = await request(app)
      .get("/dashboard");

    assert.equal(
      dashboardValue(after, "total-requests"),
      1
    );

    assert.equal(
      dashboardValue(after, "completed-requests"),
      1
    );

    assert.equal(
      dashboardValue(after, "open-requests"),
      0
    );
  });

  it("Test 12 - Dashboard Displays At Most Five Recent Requests", async () => {
    for (let index = 1; index <= 7; index += 1) {
      persistRequest({
        serviceType: `Service Type ${index}`,
        dateRequested: `2026-10-${String(index).padStart(2, "0")}`
      });
    }

    const response = await request(app)
      .get("/dashboard");

    assert.equal(response.status, 200);

    assert.equal(
      (response.text.match(/href="\/service-requests\/\d+"/g) || [])
        .length,
      5
    );

    assert.match(response.text, /Service Type 7/);
    assert.match(response.text, /Service Type 6/);
    assert.doesNotMatch(response.text, /Service Type 1/);
  });

  it("Test 13 - Recent Requests Use Date Descending Then ID Descending", async () => {
    const first = persistRequest({
      serviceType: "First",
      dateRequested: "2026-10-10"
    });

    const second = persistRequest({
      serviceType: "Second",
      dateRequested: "2026-10-10"
    });

    const third = persistRequest({
      serviceType: "Third",
      dateRequested: "2026-10-11"
    });

    const response = await request(app)
      .get("/dashboard");

    assert.equal(response.status, 200);

    const firstPosition = response.text.indexOf(
      `href="/service-requests/${first.id}"`
    );

    const secondPosition = response.text.indexOf(
      `href="/service-requests/${second.id}"`
    );

    const thirdPosition = response.text.indexOf(
      `href="/service-requests/${third.id}"`
    );

    assert.ok(thirdPosition < secondPosition);
    assert.ok(secondPosition < firstPosition);
  });

  it("Test 14 - Completed and Cancelled Requests Can Appear in Recent Results", async () => {
    const completed = persistRequest({
      status: "Completed",
      serviceType: "Completed Request"
    });

    const cancelled = persistRequest({
      status: "Cancelled",
      serviceType: "Cancelled Request"
    });

    const response = await request(app)
      .get("/dashboard");

    assert.equal(response.status, 200);

    assert.match(
      response.text,
      new RegExp(`href="/service-requests/${completed.id}"`)
    );

    assert.match(
      response.text,
      new RegExp(`href="/service-requests/${cancelled.id}"`)
    );
  });

  it("Test 15 - Dashboard GET Does Not Modify Persisted Records", async () => {
    const resident = persistResident();

    const saved = persistRequest({
      status: "Pending"
    });

    const residentsBefore =
      residentRepository.findAll();

    const requestsBefore =
      serviceRequestRepository.findAll();

    const response = await request(app)
      .get("/dashboard");

    assert.equal(response.status, 200);

    // Repeated dashboard requests must remain read-only.
    const secondResponse = await request(app)
      .get("/dashboard");

    assert.equal(secondResponse.status, 200);

    const residentsAfter =
      residentRepository.findAll();

    const requestsAfter =
      serviceRequestRepository.findAll();

    assert.deepEqual(
      residentsAfter,
      residentsBefore
    );

    assert.deepEqual(
      requestsAfter,
      requestsBefore
    );

    assert.equal(
      residentRepository.findById(resident.id).status,
      "Active"
    );

    assert.equal(
      serviceRequestRepository.findById(saved.id).status,
      "Pending"
    );
  });
});