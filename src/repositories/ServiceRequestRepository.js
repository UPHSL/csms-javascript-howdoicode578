/**
 * Service Request persistence repository.
 */

import { ServiceRequest } from "../models/ServiceRequest.js";

export class ServiceRequestRepository {
  constructor(database) {
    this.db = database;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resident_id INTEGER NOT NULL,
        service_type TEXT NOT NULL,
        description TEXT NOT NULL,
        date_requested TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `);
  }

  _mapRowToServiceRequest(row) {
    return new ServiceRequest({
      id: Number(row.id),
      residentId: Number(row.resident_id),
      serviceType: row.service_type,
      description: row.description,
      dateRequested: row.date_requested,
      status: row.status
    });
  }

  save(serviceRequest) {
    const statement = this.db.prepare(`
      INSERT INTO service_requests (
        resident_id,
        service_type,
        description,
        date_requested,
        status
      )
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = statement.run(
      serviceRequest.residentId,
      serviceRequest.serviceType,
      serviceRequest.description,
      serviceRequest.dateRequested,
      serviceRequest.status
    );

    const generatedId =
      Number(result.lastInsertRowid);

    serviceRequest.id = generatedId;

    return this.findById(generatedId);
  }

  findById(serviceRequestId) {
    const statement = this.db.prepare(`
      SELECT
        id,
        resident_id,
        service_type,
        description,
        date_requested,
        status
      FROM service_requests
      WHERE id = ?
    `);

    const row = statement.get(serviceRequestId);

    if (!row) {
      return null;
    }

    return this._mapRowToServiceRequest(row);
  }

  updateStatusById(serviceRequestId, status) {
    const statement = this.db.prepare(`
      UPDATE service_requests
      SET status = ?
      WHERE id = ?
    `);

    const result = statement.run(
      status,
      serviceRequestId
    );

    if (Number(result.changes) === 0) {
      return null;
    }

    return this.findById(serviceRequestId);
  }

  count() {
    const statement = this.db.prepare(`
      SELECT COUNT(*) AS count
      FROM service_requests
    `);

    return Number(statement.get().count);
  }
}