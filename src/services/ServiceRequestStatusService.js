/**
 * Coordinates controlled Service Request status transitions.
 */
export default class ServiceRequestStatusService {
  constructor(serviceRequestRepository) {
    this.serviceRequestRepository =
      serviceRequestRepository;
  }

  static SUPPORTED_STATUSES = [
    "Pending",
    "In Progress",
    "Completed",
    "Cancelled"
  ];

  static ALLOWED_TRANSITIONS = {
    Pending: [
      "In Progress",
      "Cancelled"
    ],
    "In Progress": [
      "Completed",
      "Cancelled"
    ],
    Completed: [],
    Cancelled: []
  };

  updateStatus(serviceRequestId, targetStatus) {
    const serviceRequest =
      this.serviceRequestRepository.findById(
        serviceRequestId
      );

    if (!serviceRequest) {
      return {
        success: false,
        status: "SERVICE_REQUEST_NOT_FOUND",
        serviceRequest: null
      };
    }

    if (
      !ServiceRequestStatusService.SUPPORTED_STATUSES
        .includes(targetStatus)
    ) {
      return {
        success: false,
        status: "UNSUPPORTED_STATUS",
        serviceRequest
      };
    }

    if (serviceRequest.status === targetStatus) {
      return {
        success: false,
        status: "SAME_STATUS",
        serviceRequest
      };
    }

    const allowedTargets =
      ServiceRequestStatusService.ALLOWED_TRANSITIONS[
        serviceRequest.status
      ];

    if (
      !allowedTargets ||
      !allowedTargets.includes(targetStatus)
    ) {
      return {
        success: false,
        status: "INVALID_TRANSITION",
        serviceRequest
      };
    }

    const updatedServiceRequest =
      this.serviceRequestRepository.updateStatusById(
        serviceRequestId,
        targetStatus
      );

    if (!updatedServiceRequest) {
      return {
        success: false,
        status: "SERVICE_REQUEST_NOT_FOUND",
        serviceRequest: null
      };
    }

    return {
      success: true,
      status: "STATUS_UPDATED",
      serviceRequest: updatedServiceRequest
    };
  }
}