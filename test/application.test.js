import assert from "node:assert/strict";
import test from "node:test";

import { ResidentValidator } from "../src/services/ResidentValidator.js";
import { Resident } from "../src/models/Resident.js";


test("Resident can be created using valid Resident information", () => {
  const resident = new Resident({
    id: 1,
    firstName: "Juan",
    lastName: "Dela Cruz",
    address: "123 Main Street",
    contactNumber: "09123456789",
    email: "juan.delacruz@example.com",
    status: "Active"
  });

  assert.ok(resident instanceof Resident);
});


test("Resident information can be assigned and retrieved correctly", () => {
  const resident = new Resident({
    id: 1,
    firstName: "Juan",
    lastName: "Dela Cruz",
    address: "123 Main Street",
    contactNumber: "09123456789",
    email: "juan.delacruz@example.com",
    status: "Active"
  });

  assert.equal(resident.id, 1);
  assert.equal(resident.firstName, "Juan");
  assert.equal(resident.lastName, "Dela Cruz");
  assert.equal(resident.address, "123 Main Street");
  assert.equal(resident.contactNumber, "09123456789");
  assert.equal(resident.email, "juan.delacruz@example.com");
  assert.equal(resident.status, "Active");
});


test("Resident status can represent Active", () => {
  const resident = new Resident({
    id: 1,
    firstName: "Juan",
    lastName: "Dela Cruz",
    address: "123 Main Street",
    contactNumber: "09123456789",
    email: "juan.delacruz@example.com",
    status: "Active"
  });

  assert.equal(resident.status, "Active");
});


test("Resident status defaults to Active", () => {
  const resident = new Resident({
    id: 1,
    firstName: "Juan",
    lastName: "Dela Cruz",
    address: "123 Main Street",
    contactNumber: "09123456789",
    email: "juan.delacruz@example.com"
  });

  assert.equal(resident.status, "Active");
});

function makeValidResident(overrides = {}) {
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

test("valid resident information passes validation", () => {
  const resident = makeValidResident();
  const validator = new ResidentValidator();

  assert.equal(validator.isValid(resident), true);
});

test("missing first name fails validation", () => {
  const resident = makeValidResident({
    firstName: ""
  });

  const validator = new ResidentValidator();
  const errors = validator.validate(resident);

  assert.equal(validator.isValid(resident), false);
  assert.equal(errors.includes("firstName"), true);
});

test("missing last name fails validation", () => {
  const resident = makeValidResident({
    lastName: ""
  });

  const validator = new ResidentValidator();
  const errors = validator.validate(resident);

  assert.equal(validator.isValid(resident), false);
  assert.equal(errors.includes("lastName"), true);
});

test("missing address fails validation", () => {
  const resident = makeValidResident({
    address: ""
  });

  const validator = new ResidentValidator();
  const errors = validator.validate(resident);

  assert.equal(validator.isValid(resident), false);
  assert.equal(errors.includes("address"), true);
});

test("whitespace-only required information fails validation", () => {
  const resident = makeValidResident({
    firstName: "   "
  });

  const validator = new ResidentValidator();
  const errors = validator.validate(resident);

  assert.equal(validator.isValid(resident), false);
  assert.equal(errors.includes("firstName"), true);
});

test("invalid contact number fails validation", () => {
  const resident = makeValidResident({
    contactNumber: "0917ABC4567"
  });

  const validator = new ResidentValidator();
  const errors = validator.validate(resident);

  assert.equal(validator.isValid(resident), false);
  assert.equal(errors.includes("contactNumber"), true);
});

test("invalid email fails validation", () => {
  const resident = makeValidResident({
    email: "juan.example.com"
  });

  const validator = new ResidentValidator();
  const errors = validator.validate(resident);

  assert.equal(validator.isValid(resident), false);
  assert.equal(errors.includes("email"), true);
});

test("supported resident statuses pass validation", () => {
  const activeResident = makeValidResident({
    status: "Active"
  });

  const inactiveResident = makeValidResident({
    status: "Inactive"
  });

  const validator = new ResidentValidator();

  assert.equal(validator.isValid(activeResident), true);
  assert.equal(validator.isValid(inactiveResident), true);
});

test("unsupported resident status fails validation", () => {
  const resident = makeValidResident({
    status: "Unknown"
  });

  const validator = new ResidentValidator();
  const errors = validator.validate(resident);

  assert.equal(validator.isValid(resident), false);
  assert.equal(errors.includes("status"), true);
});