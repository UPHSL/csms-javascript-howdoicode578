/**
 * Coordinates Service Request validation,
 * Resident eligibility, persistence, and submission results.
 */
export default class ServiceRequestSubmissionService {
  constructor(
    validator,
    residentRepository,
    serviceRequestRepository
  ) {
    this.validator = validator;
    this.residentRepository = residentRepository;
    this.serviceRequestRepository =
      serviceRequestRepository;
  }

  submitServiceRequest(serviceRequest) {
    const errors =
      this.validator.validate(serviceRequest);

    if (errors.length > 0) {
      return {
        success: false,
        status: "VALIDATION_FAILED",
        serviceRequest: null,
        errors
      };
    }

    const resident =
      this.residentRepository.findById(
        serviceRequest.residentId
      );

    if (!resident) {
      return {
        success: false,
        status: "RESIDENT_NOT_FOUND",
        serviceRequest: null,
        errors: ["Resident not found."]
      };
    }

    if (resident.status !== "Active") {
      return {
        success: false,
        status: "RESIDENT_INACTIVE",
        serviceRequest: null,
        errors: [
          "Inactive Residents cannot submit new Service Requests."
        ]
      };
    }

    serviceRequest.status = "Pending";

    const persistedServiceRequest =
      this.serviceRequestRepository.save(
        serviceRequest
      );

    return {
      success: true,
      status: "SUBMITTED",
      serviceRequest: persistedServiceRequest,
      errors: []
    };
  }
}