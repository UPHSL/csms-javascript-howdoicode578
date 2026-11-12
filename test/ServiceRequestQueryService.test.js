
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ServiceRequest } from "../src/models/ServiceRequest.js";
import { ServiceRequestRepository } from "../src/repositories/ServiceRequestRepository.js";
import { createDatabase } from "../src/database/database.js";
import ServiceRequestQueryService  from "../src/services/ServiceRequestQueryService.js";

const VALID_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Cancelled",
];


function createHarness() {
  // Give every test its own temporary SQLite database.
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "csms-t11-")
  );
  const databasePath = join(temporaryDirectory, "test.db");

  const db = createDatabase(databasePath);
  const repository = new ServiceRequestRepository(db);
  const queryService = new ServiceRequestQueryService(repository);

  function persistRequest(overrides = {}) {
    const request = new ServiceRequest({
      residentId: 1,
      serviceType: "Barangay Clearance",
      description: "Request for barangay clearance",
      dateRequested: "2026-01-15",
      status: "Pending",
      ...overrides,
    });

    const saved = repository.save(request);

    const id =
      typeof saved === "number"
        ? saved
        : saved?.id ?? request.id;

    assert.notEqual(id, null, "Saved request must have an ID.");
    assert.notEqual(id, undefined, "Saved request must have an ID.");

    const persisted = repository.findById(id);

    assert.ok(
      persisted,
      "Saved request must exist in SQLite persistence."
    );

    return persisted;
  }

  function close() {
    try {
      db.close();
    } finally {
      // Remove this test's database and temporary directory.
      rmSync(temporaryDirectory, {
        recursive: true,
        force: true,
      });
    }
  }

  return {
    db,
    repository,
    queryService,
    persistRequest,
    close,
  };
}


function requestIds(requests) {
  return requests.map((request) => request.id);
}

function assertCompleteRequest(actual, expected) {
  assert.ok(actual, "Expected a Service Request to be returned.");

  assert.equal(actual.id, expected.id);
  assert.equal(actual.residentId, expected.residentId);
  assert.equal(actual.serviceType, expected.serviceType);
  assert.equal(actual.description, expected.description);
  assert.equal(actual.dateRequested, expected.dateRequested);
  assert.equal(actual.status, expected.status);
}

test("T11 Test 1 - List all persisted Service Requests", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  const first = h.persistRequest({
    serviceType: "Barangay Clearance",
  });
  const second = h.persistRequest({
    serviceType: "Certificate of Residency",
  });
  const third = h.persistRequest({
    serviceType: "Business Permit",
  });

  const results = h.queryService.listServiceRequests();

  assert.equal(results.length, 3);
  assert.deepEqual(
    new Set(requestIds(results)),
    new Set([first.id, second.id, third.id])
  );
});

test("T11 Test 2 - Empty listing returns an empty collection", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  const results = h.queryService.listServiceRequests();

  assert.ok(Array.isArray(results));
  assert.deepEqual(results, []);
});

test("T11 Test 3 - Listing orders by dateRequested DESC, then id DESC", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  // Insert records in an order different from the expected result.
  const oldest = h.persistRequest({
    serviceType: "Oldest Request",
    dateRequested: "2026-01-01",
  });

  const newerSameDateFirst = h.persistRequest({
    serviceType: "March Request One",
    dateRequested: "2026-03-01",
  });

  const middle = h.persistRequest({
    serviceType: "February Request",
    dateRequested: "2026-02-01",
  });

  const newerSameDateSecond = h.persistRequest({
    serviceType: "March Request Two",
    dateRequested: "2026-03-01",
  });

  const results = h.queryService.listServiceRequests();

  assert.deepEqual(requestIds(results), [
    newerSameDateSecond.id,
    newerSameDateFirst.id,
    middle.id,
    oldest.id,
  ]);
});

test("T11 Test 4 - View an existing Service Request by ID", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  const expected = h.persistRequest({
    residentId: 25,
    serviceType: "Certificate of Residency",
    description: "Needed for school enrollment",
    dateRequested: "2026-04-10",
    status: "In Progress",
  });

  const actual = h.queryService.viewServiceRequest(expected.id);

  assertCompleteRequest(actual, expected);
});

test("T11 Test 5 - Viewing an unknown ID is safe and creates nothing", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  h.persistRequest();

  const before = h.queryService.listServiceRequests();
  const unknownId = 999999;
  const result = h.queryService.viewServiceRequest(unknownId);
  const after = h.queryService.listServiceRequests();

  // findById returns null when no matching record exists.
  assert.equal(result, null);
  assert.equal(after.length, before.length);
  assert.deepEqual(requestIds(after), requestIds(before));
});

test("T11 Test 6 - Partial service-type search is case-insensitive", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  const expected = h.persistRequest({
    serviceType: "Barangay Clearance",
  });

  h.persistRequest({
    serviceType: "Business Permit",
    description: "Permit application",
  });

  const results = h.queryService.searchServiceRequests("cLeAr");

  assert.deepEqual(requestIds(results), [expected.id]);
});

test("T11 Test 7 - Partial description search is case-insensitive", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  const expected = h.persistRequest({
    serviceType: "Certificate of Residency",
    description: "Requesting assistance for SCHOOL ENROLLMENT",
  });

  h.persistRequest({
    serviceType: "Business Permit",
    description: "Renewal of a business permit",
  });

  const results = h.queryService.searchServiceRequests("school EnRoll");

  assert.deepEqual(requestIds(results), [expected.id]);
});

test("T11 Test 8 - Blank search returns all requests in listing order", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  h.persistRequest({
    dateRequested: "2026-01-01",
  });
  h.persistRequest({
    dateRequested: "2026-03-01",
  });
  h.persistRequest({
    dateRequested: "2026-02-01",
  });

  const listed = h.queryService.listServiceRequests();
  const searched = h.queryService.searchServiceRequests("      ");

  assert.deepEqual(requestIds(searched), requestIds(listed));
});

test("T11 Test 9 - A text search with no match returns an empty collection", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  h.persistRequest({
    serviceType: "Barangay Clearance",
    description: "Proof of residency",
  });

  h.persistRequest({
    serviceType: "Business Permit",
    description: "Business registration",
  });

  const results = h.queryService.searchServiceRequests(
    "NonexistentKeyword"
  );

  assert.ok(Array.isArray(results));
  assert.deepEqual(results, []);
});

test("T11 Test 10 - Status filter returns only matching requests", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  h.persistRequest({ status: "Pending" });
  h.persistRequest({ status: "In Progress" });
  h.persistRequest({ status: "Completed" });
  h.persistRequest({ status: "Cancelled" });
  h.persistRequest({ status: "Pending" });

  const result = h.queryService.filterServiceRequests("Pending");

  assert.equal(result.success, true);
  assert.equal(result.status, "FILTERED");
  assert.ok(result.serviceRequests.length > 0);

  for (const request of result.serviceRequests) {
    assert.equal(request.status, "Pending");
  }

  assert.equal(result.serviceRequests.length, 2);
});

test("T11 Test 11 - Unfiltered listing includes all four lifecycle statuses", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  for (const status of VALID_STATUSES) {
    h.persistRequest({ status });
  }

  const results = h.queryService.listServiceRequests();
  const returnedStatuses = new Set(
    results.map((request) => request.status)
  );

  assert.equal(results.length, 4);

  for (const status of VALID_STATUSES) {
    assert.ok(
      returnedStatuses.has(status),
      `Expected listing to include status "${status}".`
    );
  }
});

test("T11 Test 12 - Combined text search and status filter require both conditions", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  const matchesBoth = h.persistRequest({
    serviceType: "Barangay Clearance",
    description: "Clearance requested for employment",
    status: "Pending",
  });

  h.persistRequest({
    serviceType: "Barangay Clearance",
    description: "Clearance requested for employment",
    status: "Completed",
  });

  h.persistRequest({
    serviceType: "Business Permit",
    description: "New business registration",
    status: "Pending",
  });

  h.persistRequest({
    serviceType: "Business Permit",
    description: "New business registration",
    status: "Completed",
  });

  const result = h.queryService.queryServiceRequests({
    searchTerm: "clearance",
    status: "Pending",
  });

  assert.equal(result.success, true);
  assert.equal(result.status, "QUERY_SUCCESSFUL");
  assert.deepEqual(requestIds(result.serviceRequests), [matchesBoth.id]);
});

test("T11 Test 13 - A request matching type and description appears once", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  const expected = h.persistRequest({
    serviceType: "Clearance Application",
    description: "Clearance needed for employment",
  });

  h.persistRequest({
    serviceType: "Business Permit",
    description: "Business registration",
  });

  const results = h.queryService.searchServiceRequests("clearance");
  const matchingIds = requestIds(results).filter(
    (id) => id === expected.id
  );

  assert.equal(matchingIds.length, 1);
});

test("T11 Test 14 - Search, list, and view preserve complete request information", (t) => {
  const h = createHarness();
  t.after(() => h.close());

  const expected = h.persistRequest({
    residentId: 42,
    serviceType: "Certificate of Residency",
    description: "Needed for college enrollment",
    dateRequested: "2026-06-20",
    status: "In Progress",
  });

  const listed = h.queryService.listServiceRequests();
  const listedRequest = listed.find(
    (request) => request.id === expected.id
  );

  assertCompleteRequest(listedRequest, expected);

  const searched = h.queryService.searchServiceRequests("college");
  assert.equal(searched.length, 1);
  assertCompleteRequest(searched[0], expected);

  const viewed = h.queryService.viewServiceRequest(expected.id);
  assertCompleteRequest(viewed, expected);

  // Query operations must not alter the persisted record.
  const persistedAfterQueries = h.repository.findById(expected.id);
  assertCompleteRequest(persistedAfterQueries, expected);
});
