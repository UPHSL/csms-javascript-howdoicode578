
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

import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { ServiceRequestRepository } from "../src/repositories/ServiceRequestRepository.js";


describe("T16 - Final System Release and Development Checkpoint", () => {
  let app;
  let database;
  let residentRepository;
  let serviceRequestRepository;
  let temporaryDirectory;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "csms-t16-")
    );

    const databasePath = path.join(
      temporaryDirectory,
      "csms-release-test.db"
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
   * Release Health Verification
   *
   * Verifies that the health endpoint reports
   * the official application identity and version.
   */
  it("T16.1 - Health endpoint reports the CSMS v1.0.0 release identity", async () => {
    const response = await request(app)
      .get("/health");

    assert.equal(response.status, 200);

    assert.deepEqual(response.body, {
      status: "ok",
      application: "Community Services Management System",
      version: "1.0.0"
    });
  });

  /*
   * TEST 2
   * Browser Release Version
   *
   * Verifies that the landing page displays
   * the official release version.
   */
  it("T16.2 - Landing page displays the v1.0.0 release version", async () => {
    const response = await request(app)
      .get("/");

    assert.equal(response.status, 200);
    assert.match(response.text, /Community Services Management System/);
    assert.match(response.text, /v1\.0\.0/);
  });

  /*
   * TEST 3
   * Student-Designed Final Examination Integration Test
   *
   * Integrates Resident Management, Resident Deactivation,
   * Service Request Submission, Service Request Workflow,
   * Search and Filtering, SQLite Persistence, and Dashboard.
   *
   * Verifies the known starting state, intermediate states,
   * rejected operations, and final persisted application state.
   */
  it("T16.3 - Complete CSMS workflow preserves integrated and persisted application state", async () => {
    // --------------------------------------------------
    // 1. Verify the known starting state.
    // --------------------------------------------------

    assert.equal(residentRepository.findAll().length, 0);
    assert.equal(serviceRequestRepository.findAll().length, 0);

    // --------------------------------------------------
    // 2. Register two Residents.
    // --------------------------------------------------

    const activeRegistration = await request(app)
      .post("/residents")
      .type("form")
      .send({
        firstName: "Ana",
        lastName: "Reyes",
        address: "Barangay San Isidro",
        contactNumber: "09181234567",
        email: "ana.reyes@example.com"
      });

    assert.equal(activeRegistration.status, 302);

    const secondRegistration = await request(app)
      .post("/residents")
      .type("form")
      .send({
        firstName: "Marco",
        lastName: "Santos",
        address: "Barangay Maligaya",
        contactNumber: "09191234567",
        email: "marco.santos@example.com"
      });

    assert.equal(secondRegistration.status, 302);

    const registeredResidents =
      residentRepository.findAll();

    assert.equal(registeredResidents.length, 2);

    const activeResident = registeredResidents.find(
      resident => resident.email === "ana.reyes@example.com"
    );

    const secondResident = registeredResidents.find(
      resident => resident.email === "marco.santos@example.com"
    );

    assert.ok(activeResident);
    assert.ok(secondResident);

    assert.equal(activeResident.status, "Active");
    assert.equal(secondResident.status, "Active");

    // --------------------------------------------------
    // 3. Deactivate the second Resident.
    // --------------------------------------------------

    const deactivation = await request(app)
      .post(`/residents/${secondResident.id}/deactivate`);

    assert.equal(deactivation.status, 302);

    const inactiveResident =
      residentRepository.findById(secondResident.id);

    assert.ok(inactiveResident);
    assert.equal(inactiveResident.status, "Inactive");

    // --------------------------------------------------
    // 4. Verify that an Inactive Resident cannot submit
    //    a Service Request.
    // --------------------------------------------------

    const rejectedSubmission = await request(app)
      .post("/service-requests")
      .type("form")
      .send({
        residentId: secondResident.id,
        serviceType: "Barangay Clearance",
        description: "Request from an inactive Resident",
        dateRequested: "2026-11-12"
      });

    assert.equal(rejectedSubmission.status, 400);

    assert.match(
    rejectedSubmission.text,
    /This Resident is inactive and cannot submit a new Service Request\./i
    );

    // Rejected submission must not create a record.
    assert.equal(serviceRequestRepository.findAll().length, 0);

    // --------------------------------------------------
    // 5. Submit two valid requests for the Active Resident.
    // --------------------------------------------------

    const firstSubmission = await request(app)
      .post("/service-requests")
      .type("form")
      .send({
        residentId: activeResident.id,
        serviceType: "Employment Clearance",
        description: "Required for employment application",
        dateRequested: "2026-11-12"
      });

    assert.equal(firstSubmission.status, 302);

    const secondSubmission = await request(app)
      .post("/service-requests")
      .type("form")
      .send({
        residentId: activeResident.id,
        serviceType: "School Certificate",
        description: "Required for school enrollment",
        dateRequested: "2026-11-12"
      });

    assert.equal(secondSubmission.status, 302);

    const submittedRequests =
      serviceRequestRepository.findAll();

    assert.equal(submittedRequests.length, 2);

    const employmentRequest = submittedRequests.find(
      serviceRequest =>
        serviceRequest.serviceType === "Employment Clearance"
    );

    const schoolRequest = submittedRequests.find(
      serviceRequest =>
        serviceRequest.serviceType === "School Certificate"
    );

    assert.ok(employmentRequest);
    assert.ok(schoolRequest);

    assert.equal(employmentRequest.residentId, activeResident.id);
    assert.equal(schoolRequest.residentId, activeResident.id);

    assert.equal(employmentRequest.status, "Pending");
    assert.equal(schoolRequest.status, "Pending");

    // --------------------------------------------------
    // 6. Process the first request:
    //    Pending -> In Progress -> Completed.
    // --------------------------------------------------

    const startResponse = await request(app)
      .post(`/service-requests/${employmentRequest.id}/start`);

    assert.equal(startResponse.status, 302);

    assert.equal(
      serviceRequestRepository.findById(employmentRequest.id).status,
      "In Progress"
    );

    const completeResponse = await request(app)
      .post(`/service-requests/${employmentRequest.id}/complete`);

    assert.equal(completeResponse.status, 302);

    assert.equal(
      serviceRequestRepository.findById(employmentRequest.id).status,
      "Completed"
    );

    // --------------------------------------------------
    // 7. Cancel the second request while it is Pending.
    // --------------------------------------------------

    const cancelResponse = await request(app)
      .post(`/service-requests/${schoolRequest.id}/cancel`);

    assert.equal(cancelResponse.status, 302);

    assert.equal(
      serviceRequestRepository.findById(schoolRequest.id).status,
      "Cancelled"
    );

    // --------------------------------------------------
    // 8. Verify Service Request search and filtering.
    // --------------------------------------------------

    const searchResponse = await request(app)
      .get("/service-requests")
      .query({
        search: "employment",
        status: "Completed"
      });

    assert.equal(searchResponse.status, 200);
    assert.match(searchResponse.text, /Employment Clearance/);
    assert.doesNotMatch(searchResponse.text, /School Certificate/);

    const filteredResponse = await request(app)
      .get("/service-requests")
      .query({
        status: "Cancelled"
      });

    assert.equal(filteredResponse.status, 200);
    assert.match(filteredResponse.text, /School Certificate/);
    assert.doesNotMatch(filteredResponse.text, /Employment Clearance/);

    // --------------------------------------------------
    // 9. Verify the Service Request details page.
    // --------------------------------------------------

    const detailsResponse = await request(app)
      .get(`/service-requests/${employmentRequest.id}`);

    assert.equal(detailsResponse.status, 200);
    assert.match(detailsResponse.text, /Employment Clearance/);
    assert.match(detailsResponse.text, /Completed/);

    // --------------------------------------------------
    // 10. Verify persistence through new repository instances.
    // --------------------------------------------------

    const reopenedResidentRepository =
      new ResidentRepository(database);

    const reopenedServiceRequestRepository =
      new ServiceRequestRepository(database);

    const persistedResidents =
      reopenedResidentRepository.findAll();

    const persistedRequests =
      reopenedServiceRequestRepository.findAll();

    assert.equal(persistedResidents.length, 2);
    assert.equal(persistedRequests.length, 2);

    const finalActiveResident =
      reopenedResidentRepository.findById(activeResident.id);

    const finalInactiveResident =
      reopenedResidentRepository.findById(secondResident.id);

    const finalCompletedRequest =
      reopenedServiceRequestRepository.findById(employmentRequest.id);

    const finalCancelledRequest =
      reopenedServiceRequestRepository.findById(schoolRequest.id);

    assert.ok(finalActiveResident);
    assert.ok(finalInactiveResident);
    assert.ok(finalCompletedRequest);
    assert.ok(finalCancelledRequest);

    assert.equal(finalActiveResident.status, "Active");
    assert.equal(finalInactiveResident.status, "Inactive");

    assert.equal(finalCompletedRequest.status, "Completed");
    assert.equal(finalCancelledRequest.status, "Cancelled");

    assert.equal(finalCompletedRequest.residentId, activeResident.id);
    assert.equal(finalCancelledRequest.residentId, activeResident.id);

    assert.equal(
      finalCompletedRequest.description,
      "Required for employment application"
    );

    assert.equal(
      finalCancelledRequest.description,
      "Required for school enrollment"
    );

    // --------------------------------------------------
    // 11. Verify that the Dashboard reconciles with
    //     the actual final persisted records.
    // --------------------------------------------------

    const dashboard = await request(app)
      .get("/dashboard");

    assert.equal(dashboard.status, 200);

    assert.equal(
      dashboardValue(dashboard, "total-residents"),
      2
    );

    assert.equal(
      dashboardValue(dashboard, "active-residents"),
      1
    );

    assert.equal(
      dashboardValue(dashboard, "inactive-residents"),
      1
    );

    assert.equal(
      dashboardValue(dashboard, "total-requests"),
      2
    );

    assert.equal(
      dashboardValue(dashboard, "pending-requests"),
      0
    );

    assert.equal(
      dashboardValue(dashboard, "in-progress-requests"),
      0
    );

    assert.equal(
      dashboardValue(dashboard, "completed-requests"),
      1
    );

    assert.equal(
      dashboardValue(dashboard, "cancelled-requests"),
      1
    );

    assert.equal(
      dashboardValue(dashboard, "open-requests"),
      0
    );

    // Final reconciliation checks.
    assert.equal(
      dashboardValue(dashboard, "active-residents") +
      dashboardValue(dashboard, "inactive-residents"),
      dashboardValue(dashboard, "total-residents")
    );

    assert.equal(
      dashboardValue(dashboard, "pending-requests") +
      dashboardValue(dashboard, "in-progress-requests") +
      dashboardValue(dashboard, "completed-requests") +
      dashboardValue(dashboard, "cancelled-requests"),
      dashboardValue(dashboard, "total-requests")
    );
  });
});
