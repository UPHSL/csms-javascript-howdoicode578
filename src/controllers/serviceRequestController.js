import { ServiceRequest } from "../models/ServiceRequest.js";
import ServiceRequestQueryService from "../services/ServiceRequestQueryService.js";

/**
 * Create Service Request Management controller handlers.
 *
 * @param {object} dependencies Application services.
 */
export function createServiceRequestController({
  queryService,
  submissionService,
  statusService
}) {
  function showServiceRequests(request, response) {
    const searchTerm =
      typeof request.query.search === "string"
        ? request.query.search
        : "";

    const requestedStatus =
      typeof request.query.status === "string"
        ? request.query.status
        : "";

    const selectedStatus =
      requestedStatus === "All Statuses"
        ? ""
        : requestedStatus;

    const status = selectedStatus || null;

    const result = queryService.queryServiceRequests({
      searchTerm,
      status
    });

    const filterError = result.success
      ? ""
      : "The selected status filter is not supported.";

    return response.status(200).render("service-requests/index", {
      serviceRequests: result.serviceRequests,
      searchTerm,
      selectedStatus: result.success ? selectedStatus : "",
      message: request.query.message ?? "",
      errorMessage: filterError
    });
  }

  function showSubmissionForm(request, response) {
    return response.status(200).render("service-requests/new", {
      serviceRequest: {},
      errors: [],
      errorMessage: ""
    });
  }

  function submitServiceRequest(request, response) {
    const information = {
      residentId:
        request.body.residentId === undefined ||
        request.body.residentId === ""
          ? NaN
          : Number(request.body.residentId),
      serviceType: request.body.serviceType ?? "",
      description: request.body.description ?? "",
      dateRequested: request.body.dateRequested ?? ""
    };

    const serviceRequest = new ServiceRequest({
      ...information,
      id: null,
      status: "Pending"
    });

    const result =
      submissionService.submitServiceRequest(serviceRequest);

    if (!result.success) {
      let errorMessage =
        "Please correct the information and try again.";

      if (result.status === "RESIDENT_NOT_FOUND") {
        errorMessage = "Resident not found. Please enter an existing Resident ID.";
      }

      if (result.status === "RESIDENT_INACTIVE") {
        errorMessage =
          "This Resident is inactive and cannot submit a new Service Request.";
      }

      return response.status(400).render("service-requests/new", {
        serviceRequest: information,
        errors: result.errors,
        errorMessage
      });
    }

    return response.redirect(
      `/service-requests?message=${encodeURIComponent(
        "Service Request submitted successfully."
      )}`
    );
  }

  function showServiceRequest(request, response) {
    const serviceRequestId = Number(request.params.id);

    if (
      !Number.isInteger(serviceRequestId) ||
      serviceRequestId <= 0
    ) {
      return response
        .status(404)
        .render("service-requests/not-found");
    }

    const serviceRequest =
      queryService.viewServiceRequest(serviceRequestId);

    if (!serviceRequest) {
      return response
        .status(404)
        .render("service-requests/not-found");
    }

    return response.status(200).render("service-requests/show", {
      serviceRequest,
      message: request.query.message ?? "",
      errorMessage: request.query.error ?? ""
    });
  }

  function changeStatus(targetStatus, successMessage) {
    return function updateServiceRequestStatus(request, response) {
      const serviceRequestId = Number(request.params.id);

      if (
        !Number.isInteger(serviceRequestId) ||
        serviceRequestId <= 0
      ) {
        return response
          .status(404)
          .render("service-requests/not-found");
      }

      const result = statusService.updateStatus(
        serviceRequestId,
        targetStatus
      );

      if (!result.success) {
        if (result.status === "SERVICE_REQUEST_NOT_FOUND") {
          return response
            .status(404)
            .render("service-requests/not-found");
        }

        let errorMessage =
          "The requested status change could not be completed.";

        if (result.status === "INVALID_TRANSITION") {
          errorMessage =
            "This status transition is not allowed.";
        }

        if (result.status === "SAME_STATUS") {
          errorMessage =
            "The Service Request already has that status.";
        }

        return response.redirect(
          `/service-requests/${serviceRequestId}?error=${encodeURIComponent(
            errorMessage
          )}`
        );
      }

      return response.redirect(
        `/service-requests/${serviceRequestId}?message=${encodeURIComponent(
          successMessage
        )}`
      );
    };
  }

  return {
    showServiceRequests,
    showSubmissionForm,
    submitServiceRequest,
    showServiceRequest,

    startProcessing: changeStatus(
      "In Progress",
      "Service Request is now In Progress."
    ),

    completeServiceRequest: changeStatus(
      "Completed",
      "Service Request has been completed."
    ),

    cancelServiceRequest: changeStatus(
      "Cancelled",
      "Service Request has been cancelled."
    )
  };
}