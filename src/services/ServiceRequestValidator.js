/**
 * Validates intrinsic Service Request information.
 */
export class ServiceRequestValidator {
  validate(serviceRequest) {
    const errors = [];

    if (serviceRequest.id !== null) {
      errors.push("Service Request ID must be unassigned.");
    }

    if (
      !Number.isInteger(serviceRequest.residentId) ||
      serviceRequest.residentId <= 0
    ) {
      errors.push("Resident ID must be a positive integer.");
    }

    if (
      typeof serviceRequest.serviceType !== "string" ||
      serviceRequest.serviceType.trim() === ""
    ) {
      errors.push("Service type is required.");
    }

    if (
      typeof serviceRequest.description !== "string" ||
      serviceRequest.description.trim() === ""
    ) {
      errors.push("Description is required.");
    }

    if (
      typeof serviceRequest.dateRequested !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        serviceRequest.dateRequested
      )
    ) {
      errors.push(
        "Date requested must be a valid YYYY-MM-DD date."
      );
    } else {
      const date = new Date(
        `${serviceRequest.dateRequested}T00:00:00Z`
      );

      if (Number.isNaN(date.getTime())) {
        errors.push(
          "Date requested must be a valid YYYY-MM-DD date."
        );
      }
    }

    if (serviceRequest.status !== "Pending") {
      errors.push(
        "New Service Request status must be Pending."
      );
    }

    return errors;
  }
}