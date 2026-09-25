import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Resident } from "../src/models/Resident.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { createDatabase } from "../src/database/database.js";

let testDirectory;
let databasePath;
let db;
let repository;

beforeEach(() => {
  testDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "csms-resident-test-")
  );

  databasePath = path.join(testDirectory, "residents.db");

  db = createDatabase(databasePath);
  repository = new ResidentRepository(db);
});

afterEach(() => {
  if (db) {
    db.close();
  }

  if (testDirectory && fs.existsSync(testDirectory)) {
    fs.rmSync(testDirectory, {
      recursive: true,
      force: true
    });
  }
});

test("persists a valid Resident", () => {
  const resident = new Resident({
    id: null,
    firstName: "Juan",
    lastName: "Dela Cruz",
    address: "Cavite",
    contactNumber: "09171234567",
    email: "juan@example.com",
    status: "Active"
  });

  const savedResident = repository.save(resident);

  assert.ok(savedResident);
  assert.equal(savedResident.firstName, "Juan");
});

test("assigns a database-generated identifier to a Resident", () => {
  const resident = new Resident({
    id: null,
    firstName: "Maria",
    lastName: "Santos",
    address: "Manila",
    contactNumber: "09987654321",
    email: "maria@example.com",
    status: "Active"
  });

  assert.equal(resident.id, null);

  repository.save(resident);

  assert.ok(resident.id !== null);
  assert.equal(typeof resident.id, "number");
  assert.ok(resident.id > 0);
});

test("retrieves a Resident by identifier", () => {
  const resident = new Resident({
    id: null,
    firstName: "Pedro",
    lastName: "Reyes",
    address: "Laguna",
    contactNumber: "09181234567",
    email: "pedro@example.com",
    status: "Active"
  });

  repository.save(resident);

  const retrievedResident = repository.findById(resident.id);

  assert.ok(retrievedResident instanceof Resident);
  assert.equal(retrievedResident.id, resident.id);
});

test("preserves all Resident information after persistence", () => {
  const resident = new Resident({
    id: null,
    firstName: "Ana",
    lastName: "Garcia",
    address: "Batangas",
    contactNumber: "09171234567",
    email: "ana@example.com",
    status: "Active"
  });

  repository.save(resident);

  const retrievedResident = repository.findById(resident.id);

  assert.equal(retrievedResident.firstName, "Ana");
  assert.equal(retrievedResident.lastName, "Garcia");
  assert.equal(retrievedResident.address, "Batangas");
  assert.equal(retrievedResident.contactNumber, "09171234567");
  assert.equal(retrievedResident.email, "ana@example.com");
  assert.equal(retrievedResident.status, "Active");
});

test("preserves Active status after persistence", () => {
  const resident = new Resident({
    id: null,
    firstName: "Carlos",
    lastName: "Mendoza",
    address: "Cavite",
    contactNumber: "09192345678",
    email: "carlos@example.com",
    status: "Active"
  });

  repository.save(resident);

  const retrievedResident = repository.findById(resident.id);

  assert.equal(retrievedResident.status, "Active");
});

test("returns null when the Resident does not exist", () => {
  const retrievedResident = repository.findById(999999);

  assert.equal(retrievedResident, null);
});

test("persists data across different repository instances", () => {
  const resident = new Resident({
    id: null,
    firstName: "Jose",
    lastName: "Bautista",
    address: "Quezon City",
    contactNumber: "09171234567",
    email: "jose@example.com",
    status: "Active"
  });

  repository.save(resident);

  const savedId = resident.id;

  db.close();
  db = null;

  const newDb = createDatabase(databasePath);
  const newRepository = new ResidentRepository(newDb);

  const retrievedResident = newRepository.findById(savedId);

  assert.ok(retrievedResident instanceof Resident);
  assert.equal(retrievedResident.id, savedId);
  assert.equal(retrievedResident.firstName, "Jose");
  assert.equal(retrievedResident.lastName, "Bautista");
  assert.equal(retrievedResident.address, "Quezon City");
  assert.equal(retrievedResident.contactNumber, "09171234567");
  assert.equal(retrievedResident.email, "jose@example.com");
  assert.equal(retrievedResident.status, "Active");

  newDb.close();
});

test("assigns different identifiers to separately persisted Residents", () => {
  const firstResident = new Resident({
    id: null,
    firstName: "First",
    lastName: "Resident",
    address: "Cavite",
    contactNumber: "09171111111",
    email: "first@example.com",
    status: "Active"
  });

  const secondResident = new Resident({
    id: null,
    firstName: "Second",
    lastName: "Resident",
    address: "Laguna",
    contactNumber: "09222222222",
    email: "second@example.com",
    status: "Active"
  });

  repository.save(firstResident);
  repository.save(secondResident);

  assert.ok(firstResident.id > 0);
  assert.ok(secondResident.id > 0);
  assert.notEqual(firstResident.id, secondResident.id);
});