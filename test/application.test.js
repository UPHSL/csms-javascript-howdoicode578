import assert from "node:assert/strict";
import test from "node:test";

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