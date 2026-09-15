/**
 * Resident persistence repository.
 */

import { createDatabase } from "../database/database.js";
import { Resident } from "../models/Resident.js";

export class ResidentRepository {
  constructor(database) {
    this.db = database;
    this.ownsDatabase = typeof database === "string";

    if (this.ownsDatabase) {
      const db = createDatabase(database);
      db.close();
    }
  }

  save(resident) {
    const db = this.ownsDatabase
      ? createDatabase(this.db)
      : this.db;

    try {
      const statement = db.prepare(`
        INSERT INTO residents (
          first_name,
          last_name,
          address,
          contact_number,
          email,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = statement.run(
        resident.firstName,
        resident.lastName,
        resident.address,
        resident.contactNumber,
        resident.email,
        resident.status
      );

      const generatedId =
        Number(result.lastInsertRowid);

      resident.id = generatedId;

      return resident;
    } finally {
      if (this.ownsDatabase) {
        db.close();
      }
    }
  }

  findById(residentId) {
    const db = this.ownsDatabase
      ? createDatabase(this.db)
      : this.db;

    try {
      const statement = db.prepare(`
        SELECT
          id,
          first_name,
          last_name,
          address,
          contact_number,
          email,
          status
        FROM residents
        WHERE id = ?
      `);

      const row = statement.get(residentId);

      if (!row) {
        return null;
      }

      return new Resident({
        id: Number(row.id),
        firstName: row.first_name,
        lastName: row.last_name,
        address: row.address,
        contactNumber: row.contact_number,
        email: row.email,
        status: row.status
      });
    } finally {
      if (this.ownsDatabase) {
        db.close();
      }
    }
  }
}