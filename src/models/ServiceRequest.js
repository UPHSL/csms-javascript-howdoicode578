/**
 * Represents a service request in the Community Services Management System.
 */
export class ServiceRequest {
  constructor({
    id = null,
    residentId,
    serviceType,
    description,
    dateRequested,
    status = "Pending"
  }) {
    this.id = id;
    this.residentId = residentId;
    this.serviceType = serviceType;
    this.description = description;
    this.dateRequested = dateRequested;
    this.status = status;
  }
}