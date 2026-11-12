/**
 * Coordinates the controlled deactivation of an existing Resident.
 */
export default class ResidentDeactivationService {
  constructor(repository) {
    this.repository = repository;
  }

  deactivateResident(residentId) {
    const existingResident =
      this.repository.findById(residentId);

    if (!existingResident) {
      return {
        success: false,
        status: "NOT_FOUND",
        resident: null
      };
    }

    if (existingResident.status === "Inactive") {
      return {
        success: true,
        status: "ALREADY_INACTIVE",
        resident: existingResident
      };
    }

    const deactivatedResident =
      this.repository.deactivateById(residentId);

    if (!deactivatedResident) {
      return {
        success: false,
        status: "NOT_FOUND",
        resident: null
      };
    }

    return {
      success: true,
      status: "DEACTIVATED",
      resident: deactivatedResident
    };
  }
}