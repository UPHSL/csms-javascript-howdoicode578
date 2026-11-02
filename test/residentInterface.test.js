
import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";

import { createApp } from "../src/app.js";
import { Resident } from "../src/models/Resident.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";

describe("T12 - Resident Management Interface Integration Tests", () => {
  let app;
  let database;
  let repository;
  let temporaryDirectory;

  const sampleResident = {
    firstName: "Juan",
    lastName: "Dela Cruz",
    address: "Barangay Santo Tomas",
    contactNumber: "09171234567",
    email: "juan@example.com",
    status: "Active"
  };

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "csms-t12-")
    );

    const databasePath = path.join(
      temporaryDirectory,
      "residents.db"
    );

    app = createApp({ databasePath });
    database = app.locals.database;
    repository = new ResidentRepository(database);
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
    const resident = new Resident({
      ...sampleResident,
      ...overrides
    });

    return repository.save(resident);
  }

  function assertResidentFieldsPresent(response) {
    for (const field of [
      "firstName",
      "lastName",
      "address",
      "contactNumber",
      "email"
    ]) {
      assert.match(
        response.text,
        new RegExp(`name="${field}"`)
      );
    }
  }

  it("Test 1 - Resident Management Page Loads Successfully", async () => {
    const response = await request(app).get("/residents");

    assert.equal(response.status, 200);
    assert.match(response.text, /Resident Management/);
  });

  it("Test 2 - Resident List Displays Persisted Residents", async () => {
    persistResident({
      firstName: "Juan",
      lastName: "Dela Cruz"
    });

    persistResident({
      firstName: "Maria",
      lastName: "Santos",
      email: "maria@example.com"
    });

    const response = await request(app).get("/residents");

    assert.equal(response.status, 200);
    assert.match(response.text, /Juan/);
    assert.match(response.text, /Dela Cruz/);
    assert.match(response.text, /Maria/);
    assert.match(response.text, /Santos/);
  });

  it("Test 3 - Resident Search Uses Existing Search Behavior", async () => {
    persistResident({
      firstName: "Jonathan",
      lastName: "Reyes"
    });

    persistResident({
      firstName: "Maria",
      lastName: "Santos",
      email: "maria@example.com"
    });

    const response = await request(app)
      .get("/residents")
      .query({ search: "JON" });

    assert.equal(response.status, 200);
    assert.match(response.text, /Jonathan/);
    assert.doesNotMatch(response.text, /Maria/);
  });

  it("Test 4 - Blank Search Displays All Residents", async () => {
    persistResident({
      firstName: "Juan",
      lastName: "Dela Cruz"
    });

    persistResident({
      firstName: "Maria",
      lastName: "Santos",
      email: "maria@example.com"
    });

    const response = await request(app)
      .get("/residents")
      .query({ search: "   " });

    assert.equal(response.status, 200);
    assert.match(response.text, /Juan/);
    assert.match(response.text, /Maria/);
  });

  it("Test 5 - Registration Form Is Accessible", async () => {
    const response = await request(app).get("/residents/new");

    assert.equal(response.status, 200);
    assertResidentFieldsPresent(response);
  });

  it("Test 6 - Valid Registration Persists Resident", async () => {
    const response = await request(app)
      .post("/residents")
      .type("form")
      .send({
        firstName: "Juan",
        lastName: "Dela Cruz",
        address: "Barangay Santo Tomas",
        contactNumber: "09171234567",
        email: "juan@example.com"
      });

    assert.equal(response.status, 302);
    assert.match(response.headers.location, /\/residents/);

    const residents = repository.findAll();

    assert.equal(residents.length, 1);
    assert.ok(residents[0].id);
    assert.equal(residents[0].firstName, "Juan");
    assert.equal(residents[0].status, "Active");

    const listing = await request(app).get("/residents");

    assert.equal(listing.status, 200);
    assert.match(listing.text, /Juan/);
    assert.match(listing.text, /Active/);
  });

  it("Test 7 - Invalid Registration Shows Feedback and Does Not Persist", async () => {
    const response = await request(app)
      .post("/residents")
      .type("form")
      .send({
        firstName: "",
        lastName: "Dela Cruz",
        address: "Barangay Santo Tomas",
        contactNumber: "123",
        email: "invalid-email"
      });

    assert.equal(response.status, 400);
    assert.match(response.text, /correct|error|required|invalid/i);
    assert.equal(repository.findAll().length, 0);
  });

  it("Test 8 - Edit Form Displays Existing Resident Information", async () => {
    const resident = persistResident();

    const response = await request(app)
      .get(`/residents/${resident.id}/edit`);

    assert.equal(response.status, 200);
    assert.match(response.text, /Juan/);
    assert.match(response.text, /Dela Cruz/);
    assert.match(response.text, /Barangay Santo Tomas/);
    assert.match(response.text, /09171234567/);
    assert.match(response.text, /juan@example.com/);

    assertResidentFieldsPresent(response);

    assert.doesNotMatch(response.text, /name="id"/);
    assert.doesNotMatch(response.text, /name="status"/);
  });

  it("Test 9 - Valid Update Persists Changes", async () => {
    const resident = persistResident();

    const response = await request(app)
      .post(`/residents/${resident.id}/edit`)
      .type("form")
      .send({
        firstName: "Juan Carlos",
        lastName: "Dela Cruz",
        address: "Barangay San Jose",
        contactNumber: "09171234567",
        email: "juancarlos@example.com"
      });

    assert.equal(response.status, 302);

    const updatedResident = repository.findById(resident.id);

    assert.ok(updatedResident);
    assert.equal(updatedResident.id, resident.id);
    assert.equal(updatedResident.firstName, "Juan Carlos");
    assert.equal(updatedResident.address, "Barangay San Jose");
    assert.equal(updatedResident.email, "juancarlos@example.com");
    assert.equal(updatedResident.status, "Active");
  });

  it("Test 10 - Invalid Update Does Not Modify Resident", async () => {
    const resident = persistResident();

    const response = await request(app)
      .post(`/residents/${resident.id}/edit`)
      .type("form")
      .send({
        firstName: "",
        lastName: "Dela Cruz",
        address: "Changed Address",
        contactNumber: "invalid",
        email: "invalid-email"
      });

    assert.equal(response.status, 400);
    assert.match(response.text, /correct|error|required|invalid/i);

    const unchangedResident = repository.findById(resident.id);

    assert.equal(unchangedResident.firstName, "Juan");
    assert.equal(
      unchangedResident.address,
      "Barangay Santo Tomas"
    );
    assert.equal(
      unchangedResident.contactNumber,
      "09171234567"
    );
    assert.equal(unchangedResident.email, "juan@example.com");
    assert.equal(unchangedResident.status, "Active");
  });

  it("Test 11 - Missing Resident Edit Is Handled Safely", async () => {
    const response = await request(app)
      .get("/residents/99999/edit");

    assert.equal(response.status, 404);
    assert.match(response.text, /not found/i);
  });

  it("Test 12 - Active Resident Can Be Deactivated Through the Interface", async () => {
    const resident = persistResident();

    const response = await request(app)
      .post(`/residents/${resident.id}/deactivate`);

    assert.equal(response.status, 302);

    const deactivatedResident = repository.findById(resident.id);

    assert.ok(deactivatedResident);
    assert.equal(deactivatedResident.status, "Inactive");
  });

  it("Test 13 - Inactive Resident Remains Visible", async () => {
    const resident = persistResident();

    const deactivationResponse = await request(app)
      .post(`/residents/${resident.id}/deactivate`);

    assert.equal(deactivationResponse.status, 302);

    const listing = await request(app).get("/residents");

    assert.equal(listing.status, 200);
    assert.match(listing.text, /Juan/);
    assert.match(listing.text, /Inactive/);
  });

  it("Test 14 - GET Requests Do Not Deactivate Residents", async () => {
    const resident = persistResident();

    const listing = await request(app).get("/residents");
    assert.equal(listing.status, 200);

    const searching = await request(app)
      .get("/residents")
      .query({ search: "Juan" });
    assert.equal(searching.status, 200);

    const editForm = await request(app)
      .get(`/residents/${resident.id}/edit`);
    assert.equal(editForm.status, 200);

    const getDeactivation = await request(app)
      .get(`/residents/${resident.id}/deactivate`);

    assert.equal(getDeactivation.status, 404);

    const unchangedResident = repository.findById(resident.id);

    assert.ok(unchangedResident);
    assert.equal(unchangedResident.status, "Active");
  });
});
