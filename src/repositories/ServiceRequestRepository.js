
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

    const generatedId = Number(result.lastInsertRowid);

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

  /**
   * Retrieves all Service Requests in the required order.
   */
  findAll() {
    const statement = this.db.prepare(`
      SELECT
        id,
        resident_id,
        service_type,
        description,
        date_requested,
        status
      FROM service_requests
      ORDER BY date_requested DESC, id DESC
    `);

    return statement.all().map((row) =>
      this._mapRowToServiceRequest(row)
    );
  }

  /**
   * Searches service type and description using a
   * case-insensitive partial match.
   */
  searchByText(searchTerm) {
    const normalizedTerm = String(searchTerm).trim();

    if (normalizedTerm.length === 0) {
      return this.findAll();
    }

    // Escape SQL LIKE wildcards so they are treated literally.
    const escapedTerm = normalizedTerm.replace(
      /[\\%_]/g,
      "\\$&"
    );

    const pattern = `%${escapedTerm}%`;

    const statement = this.db.prepare(`
      SELECT
        id,
        resident_id,
        service_type,
        description,
        date_requested,
        status
      FROM service_requests
      WHERE
        service_type LIKE ? ESCAPE '\\'
        COLLATE NOCASE
        OR description LIKE ? ESCAPE '\\'
        COLLATE NOCASE
      ORDER BY date_requested DESC, id DESC
    `);

    return statement.all(pattern, pattern).map((row) =>
      this._mapRowToServiceRequest(row)
    );
  }

  /**
   * Retrieves Service Requests matching an exact status.
   */
  findByStatus(status) {
    const statement = this.db.prepare(`
      SELECT
        id,
        resident_id,
        service_type,
        description,
        date_requested,
        status
      FROM service_requests
      WHERE status = ?
      ORDER BY date_requested DESC, id DESC
    `);

    return statement.all(status).map((row) =>
      this._mapRowToServiceRequest(row)
    );
  }

  /**
   * Combines text search and status filtering in SQLite.
   * Both filters must match when both are provided.
   */
  findByFilters({ searchTerm = "", status = null } = {}) {
    const normalizedTerm =
      typeof searchTerm === "string"
        ? searchTerm.trim()
        : "";

    const conditions = [];
    const parameters = [];

    if (normalizedTerm.length > 0) {
      const escapedTerm = normalizedTerm.replace(
        /[\\%_]/g,
        "\\$&"
      );

      const pattern = `%${escapedTerm}%`;

      conditions.push(`
        (
          service_type LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR description LIKE ? ESCAPE '\\' COLLATE NOCASE
        )
      `);

      parameters.push(pattern, pattern);
    }

    if (status !== null && status !== undefined) {
      conditions.push("status = ?");
      parameters.push(status);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const statement = this.db.prepare(`
      SELECT
        id,
        resident_id,
        service_type,
        description,
        date_requested,
        status
      FROM service_requests
      ${whereClause}
      ORDER BY date_requested DESC, id DESC
    `);

    return statement.all(...parameters).map((row) =>
      this._mapRowToServiceRequest(row)
    );
  }

  updateStatusById(serviceRequestId, status) {
    const statement = this.db.prepare(`
      UPDATE service_requests
      SET status = ?
      WHERE id = ?
    `);

    const result = statement.run(status, serviceRequestId);

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
