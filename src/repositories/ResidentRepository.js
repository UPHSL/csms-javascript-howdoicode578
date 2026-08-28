/**
 * Resident persistence placeholder.
 *
 * Persistence behavior will be introduced through a future CSMS ticket.
 */
import { Resident } from "../models/Resident.js";

export class ResidentRepository {
  constructor(db) {
    this.db = db;
  }

  save(resident) {
    const statement = this.db.prepare(`
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

    const generatedId = Number(result.lastInsertRowid);

    resident.id = generatedId;

    return resident;
  }

  findById(residentId) {
    const statement = this.db.prepare(`
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
  }
}