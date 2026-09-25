import test from "node:test";
import assert from "node:assert/strict";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

import { Resident } from "../src/models/Resident.js";
import { ResidentRepository } from "../src/repositories/ResidentRepository.js";
import { ResidentValidator } from "../src/services/ResidentValidator.js";
import ResidentUpdateService
  from "../src/services/ResidentUpdateService.js";

function createTemporaryDatabasePath() {
  const fileName =
    `csms-t06-${crypto.randomUUID()}.sqlite`;

  return path.join(
    os.tmpdir(),
    fileName
  );
}

function removeDatabase(databasePath) {
  if (fs.existsSync(databasePath)) {
    fs.unlinkSync(databasePath);
  }
}

function createUpdateSetup() {
  const databasePath =
    createTemporaryDatabasePath();

  const repository =
    new ResidentRepository(
      databasePath
    );

  const validator =
    new ResidentValidator();

  const service =
    new ResidentUpdateService(
      validator,
      repository
    );

  return {
    databasePath,
    repository,
    service
  };
}

function cleanupUpdateSetup(
  databasePath,
  repository
) {
  if (
    repository
    && typeof repository.close
      === "function"
  ) {
    repository.close();
  }

  removeDatabase(
    databasePath
  );
}

function makeResident(
  firstName = "Juan",
  lastName = "Cruz",
  address = "Barangay Santo Tomas",
  contactNumber = "09171234567",
  email = "juan@example.com",
  status = "Active"
) {
  return new Resident({
    firstName,
    lastName,
    address,
    contactNumber,
    email,
    status
  });
}

function saveResident(
  repository,
  resident
) {
  return repository.save(
    resident
  );
}

function updateInformation(
  firstName,
  lastName,
  address,
  contactNumber,
  email
) {
  return {
    firstName,
    lastName,
    address,
    contactNumber,
    email
  };
}

test(
  "valid Resident update succeeds",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident =
        saveResident(
          repository,
          makeResident()
        );

      const result =
        service.updateResident(
          resident.id,
          updateInformation(
            "Juan Miguel",
            "Dela Cruz",
            "Barangay San Jose",
            "09181234567",
            "juan.miguel@example.com"
          )
        );

      assert.equal(
        result.success,
        true
      );

      assert.equal(
        result.notFound,
        false
      );

      assert.deepEqual(
        result.errors,
        []
      );

      assert.ok(
        result.resident
      );
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);

test(
  "Resident ID is preserved after update",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident =
        saveResident(
          repository,
          makeResident()
        );

      const originalId =
        resident.id;

      const result =
        service.updateResident(
          originalId,
          updateInformation(
            "Maria",
            "Santos",
            "Barangay San Roque",
            "09181234567",
            "maria@example.com"
          )
        );

      assert.equal(
        result.success,
        true
      );

      assert.equal(
        result.resident.id,
        originalId
      );

      const persisted =
        repository.findById(
          originalId
        );

      assert.equal(
        persisted.id,
        originalId
      );
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);

test(
  "permitted Resident information is persisted",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident =
        saveResident(
          repository,
          makeResident()
        );

      const result =
        service.updateResident(
          resident.id,
          updateInformation(
            "Maria",
            "Santos",
            "Barangay San Jose",
            "09981234567",
            "maria.santos@example.com"
          )
        );

      assert.equal(
        result.success,
        true
      );

      const persisted =
        repository.findById(
          resident.id
        );

      assert.equal(
        persisted.firstName,
        "Maria"
      );

      assert.equal(
        persisted.lastName,
        "Santos"
      );

      assert.equal(
        persisted.address,
        "Barangay San Jose"
      );

      assert.equal(
        persisted.contactNumber,
        "09981234567"
      );

      assert.equal(
        persisted.email,
        "maria.santos@example.com"
      );
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);

test(
  "Resident status is preserved during update",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident =
        saveResident(
          repository,
          makeResident(
            "Juan",
            "Cruz",
            "Barangay Santo Tomas",
            "09171234567",
            "juan@example.com",
            "Active"
          )
        );

      const result =
        service.updateResident(
          resident.id,
          updateInformation(
            "Juan Miguel",
            "Dela Cruz",
            "Barangay San Jose",
            "09181234567",
            "juan.miguel@example.com"
          )
        );

      assert.equal(
        result.success,
        true
      );

      assert.equal(
        result.resident.status,
        "Active"
      );

      const persisted =
        repository.findById(
          resident.id
        );

      assert.equal(
        persisted.status,
        "Active"
      );
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);

test(
  "invalid Resident update fails validation",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident =
        saveResident(
          repository,
          makeResident()
        );

      const result =
        service.updateResident(
          resident.id,
          updateInformation(
            "",
            "Dela Cruz",
            "Barangay San Jose",
            "09181234567",
            "juan@example.com"
          )
        );

      assert.equal(
        result.success,
        false
      );

      assert.equal(
        result.notFound,
        false
      );

      assert.ok(
        result.errors.length > 0
      );

      assert.equal(
        result.resident,
        null
      );
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);

test(
  "invalid update does not modify persisted information",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident =
        saveResident(
          repository,
          makeResident(
            "Juan",
            "Cruz",
            "Barangay Santo Tomas",
            "09171234567",
            "juan@example.com"
          )
        );

      const result =
        service.updateResident(
          resident.id,
          updateInformation(
            "",
            "Changed",
            "Changed Address",
            "ABC",
            "invalid-email"
          )
        );

      assert.equal(
        result.success,
        false
      );

      const persisted =
        repository.findById(
          resident.id
        );

      assert.equal(
        persisted.firstName,
        "Juan"
      );

      assert.equal(
        persisted.lastName,
        "Cruz"
      );

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
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);

test(
  "updating a nonexistent Resident is handled safely",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const result =
        service.updateResident(
          999999,
          updateInformation(
            "Juan",
            "Cruz",
            "Barangay Santo Tomas",
            "09171234567",
            "juan@example.com"
          )
        );

      assert.equal(
        result.success,
        false
      );

      assert.equal(
        result.notFound,
        true
      );

      assert.deepEqual(
        result.errors,
        []
      );

      assert.equal(
        result.resident,
        null
      );
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);

test(
  "nonexistent Resident update does not create a Resident",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const original =
        saveResident(
          repository,
          makeResident()
        );

      const result =
        service.updateResident(
          999999,
          updateInformation(
            "Maria",
            "Santos",
            "Barangay San Jose",
            "09181234567",
            "maria@example.com"
          )
        );

      assert.equal(
        result.success,
        false
      );

      assert.equal(
        result.notFound,
        true
      );

      const existing =
        repository.findById(
          original.id
        );

      assert.ok(
        existing
      );

      assert.equal(
        existing.id,
        original.id
      );

      assert.equal(
        existing.firstName,
        "Juan"
      );

      const nonexistent =
        repository.findById(
          999999
        );

      assert.equal(
        nonexistent,
        null
      );
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);

test(
  "updated Resident is visible through T05 search",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident =
        saveResident(
          repository,
          makeResident(
            "Juan",
            "Cruz",
            "Barangay Santo Tomas",
            "09171234567",
            "juan@example.com"
          )
        );

      const result =
        service.updateResident(
          resident.id,
          updateInformation(
            "Miguel",
            "Santos",
            "Barangay San Jose",
            "09181234567",
            "miguel@example.com"
          )
        );

      assert.equal(
        result.success,
        true
      );

      const results =
        repository.searchByName(
          "Miguel"
        );

      assert.equal(
        results.length,
        1
      );

      assert.equal(
        results[0].id,
        resident.id
      );

      assert.equal(
        results[0].firstName,
        "Miguel"
      );

      assert.equal(
        results[0].lastName,
        "Santos"
      );
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);

test(
  "updated information and contact number are preserved",
  () => {
    const {
      databasePath,
      repository,
      service
    } = createUpdateSetup();

    try {
      const resident =
        saveResident(
          repository,
          makeResident(
            "Juan",
            "Cruz",
            "Barangay Santo Tomas",
            "09171234567",
            "juan@example.com",
            "Inactive"
          )
        );

      const originalId =
        resident.id;

      const result =
        service.updateResident(
          originalId,
          updateInformation(
            "Miguel",
            "Santos",
            "Barangay San Roque",
            "09181234567",
            "miguel.santos@example.com"
          )
        );

      assert.equal(
        result.success,
        true
      );

      const persisted =
        repository.findById(
          originalId
        );

      assert.equal(
        persisted.id,
        originalId
      );

      assert.equal(
        persisted.firstName,
        "Miguel"
      );

      assert.equal(
        persisted.lastName,
        "Santos"
      );

      assert.equal(
        persisted.address,
        "Barangay San Roque"
      );

      assert.equal(
        persisted.contactNumber,
        "09181234567"
      );

      assert.equal(
        persisted.email,
        "miguel.santos@example.com"
      );

      assert.equal(
        persisted.status,
        "Inactive"
      );
    } finally {
      cleanupUpdateSetup(
        databasePath,
        repository
      );
    }
  }
);