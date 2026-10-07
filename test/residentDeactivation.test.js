import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import { Resident } from "../src/models/Resident.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import ResidentDeactivationService from "../src/services/ResidentDeactivationService.js";

function createTestRepository() {
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

  return {
    db,
    repository: new ResidentRepository(db)
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

/**
 * Test 1 - Active Resident Can Be Deactivated
 */
test("T07.1 - Active Resident can be deactivated", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const resident =
    repository.save(createResident());

  const result =
    service.deactivateResident(resident.id);

  assert.equal(result.success, true);
  assert.equal(result.status, "DEACTIVATED");
  assert.equal(result.resident.status, "Inactive");

  db.close();
});

/**
 * Test 2 - Resident Status Becomes Inactive in Persistence
 */
test("T07.2 - Resident status becomes Inactive in persistence", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const resident =
    repository.save(createResident());

  service.deactivateResident(resident.id);

  const persisted =
    repository.findById(resident.id);

  assert.notEqual(persisted, null);
  assert.equal(persisted.status, "Inactive");

  db.close();
});

/**
 * Test 3 - Resident ID Is Preserved
 */
test("T07.3 - Resident ID is preserved", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const resident =
    repository.save(createResident());

  const originalId = resident.id;

  const result =
    service.deactivateResident(originalId);

  const persisted =
    repository.findById(originalId);

  assert.equal(result.success, true);
  assert.equal(result.resident.id, originalId);
  assert.equal(persisted.id, originalId);

  db.close();
});

/**
 * Test 4 - Resident Information Is Preserved
 */
test("T07.4 - Resident information is preserved", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const resident =
    repository.save(createResident());

  service.deactivateResident(resident.id);

  const persisted =
    repository.findById(resident.id);

  assert.equal(persisted.firstName, "Juan");
  assert.equal(persisted.lastName, "Dela Cruz");
  assert.equal(
    persisted.address,
    "Barangay Santo Tomas"
  );
  assert.equal(
    persisted.contactNumber,
    "09171234567"
  );
  assert.equal(
    persisted.email,
    "juan@example.com"
  );

  assert.equal(persisted.status, "Inactive");

  db.close();
});

/**
 * Test 5 - Deactivated Resident Remains Persisted and Retrievable
 */
test("T07.5 - Deactivated Resident remains persisted and retrievable", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const resident =
    repository.save(createResident());

  service.deactivateResident(resident.id);

  const persisted =
    repository.findById(resident.id);

  assert.notEqual(persisted, null);
  assert.equal(persisted.id, resident.id);
  assert.equal(persisted.status, "Inactive");

  db.close();
});

/**
 * Test 6 - Deactivated Resident Remains Available Through T05
 */
test("T07.6 - Deactivated Resident remains available through T05 search and listing", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const resident =
    repository.save(
      createResident({
        firstName: "Maria",
        lastName: "Santos"
      })
    );

  service.deactivateResident(resident.id);

  const listed =
    repository.findAll();

  const searched =
    repository.searchByName("maria");

  const listedResident =
    listed.find(
      (item) => item.id === resident.id
    );

  const searchedResident =
    searched.find(
      (item) => item.id === resident.id
    );

  assert.notEqual(listedResident, undefined);
  assert.equal(
    listedResident.status,
    "Inactive"
  );

  assert.notEqual(searchedResident, undefined);
  assert.equal(
    searchedResident.status,
    "Inactive"
  );

  db.close();
});

/**
 * Test 7 - Already-Inactive Resident Is Handled Safely
 */
test("T07.7 - Already-Inactive Resident is handled safely", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const resident =
    repository.save(
      createResident({
        status: "Inactive"
      })
    );

  const originalId = resident.id;

  const result =
    service.deactivateResident(originalId);

  const persisted =
    repository.findById(originalId);

  assert.equal(result.success, true);
  assert.equal(
    result.status,
    "ALREADY_INACTIVE"
  );

  assert.equal(
    result.resident.id,
    originalId
  );

  assert.equal(
    persisted.id,
    originalId
  );

  assert.equal(
    persisted.status,
    "Inactive"
  );

  assert.equal(
    persisted.firstName,
    resident.firstName
  );

  assert.equal(
    persisted.lastName,
    resident.lastName
  );

  assert.equal(
    persisted.address,
    resident.address
  );

  assert.equal(
    persisted.contactNumber,
    resident.contactNumber
  );

  assert.equal(
    persisted.email,
    resident.email
  );

  db.close();
});

/**
 * Test 8 - Nonexistent Resident Is Handled Safely
 */
test("T07.8 - Nonexistent Resident is handled safely", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const result =
    service.deactivateResident(999999);

  assert.equal(result.success, false);
  assert.equal(result.status, "NOT_FOUND");
  assert.equal(result.resident, null);

  db.close();
});

/**
 * Test 9 - Nonexistent Deactivation Does Not Create or Delete Records
 */
test("T07.9 - Nonexistent deactivation does not create or delete records", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const first =
    repository.save(createResident());

  const second =
    repository.save(
      createResident({
        firstName: "Maria",
        lastName: "Santos",
        address: "Barangay Maligaya",
        contactNumber: "09987654321",
        email: "maria@example.com"
      })
    );

  const before =
    repository.findAll();

  const result =
    service.deactivateResident(999999);

  const after =
    repository.findAll();

  assert.equal(result.success, false);
  assert.equal(result.status, "NOT_FOUND");

  assert.equal(
    after.length,
    before.length
  );

  assert.deepEqual(
    after.map((resident) => resident.id),
    before.map((resident) => resident.id)
  );

  assert.equal(
    repository.findById(first.id).status,
    "Active"
  );

  assert.equal(
    repository.findById(second.id).status,
    "Active"
  );

  db.close();
});

/**
 * Test 10 - Deactivating One Resident Does Not Affect Another
 */
test("T07.10 - Deactivating one Resident does not affect another", () => {
  const { db, repository } = createTestRepository();
  const service =
    new ResidentDeactivationService(repository);

  const target =
    repository.save(createResident());

  const other =
    repository.save(
      createResident({
        firstName: "Maria",
        lastName: "Santos",
        address: "Barangay Maligaya",
        contactNumber: "09987654321",
        email: "maria@example.com"
      })
    );

  service.deactivateResident(target.id);

  const targetAfter =
    repository.findById(target.id);

  const otherAfter =
    repository.findById(other.id);

  assert.equal(
    targetAfter.status,
    "Inactive"
  );

  assert.equal(
    otherAfter.status,
    "Active"
  );

  assert.equal(
    otherAfter.firstName,
    "Maria"
  );

  assert.equal(
    otherAfter.lastName,
    "Santos"
  );

  assert.equal(
    otherAfter.address,
    "Barangay Maligaya"
  );

  assert.equal(
    otherAfter.contactNumber,
    "09987654321"
  );

  assert.equal(
    otherAfter.email,
    "maria@example.com"
  );

  db.close();
});