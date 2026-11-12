
/**
 * Coordinates Service Request listing, searching,
 * viewing, and status filtering.
 */

export default class ServiceRequestQueryService {
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

  listServiceRequests() {
    return this.serviceRequestRepository.findAll();
  }

  viewServiceRequest(serviceRequestId) {
    return this.serviceRequestRepository.findById(
      serviceRequestId
    );
  }

  searchServiceRequests(searchTerm) {
    const normalizedSearchTerm =
      typeof searchTerm === "string"
        ? searchTerm.trim()
        : "";

    if (normalizedSearchTerm.length === 0) {
      return this.listServiceRequests();
    }

    return this.serviceRequestRepository.searchByText(
      normalizedSearchTerm
    );
  }

  filterServiceRequests(status) {
    if (
      !ServiceRequestQueryService.SUPPORTED_STATUSES
        .includes(status)
    ) {
      return {
        success: false,
        status: "UNSUPPORTED_STATUS",
        serviceRequests: []
      };
    }

    return {
      success: true,
      status: "FILTERED",
      serviceRequests:
        this.serviceRequestRepository.findByStatus(status)
    };
  }

  queryServiceRequests({
    searchTerm = "",
    status = null
  } = {}) {
    if (
      status !== null &&
      status !== undefined &&
      !ServiceRequestQueryService.SUPPORTED_STATUSES
        .includes(status)
    ) {
      return {
        success: false,
        status: "UNSUPPORTED_STATUS",
        serviceRequests: []
      };
    }

    return {
      success: true,
      status: "QUERY_SUCCESSFUL",
      serviceRequests:
        this.serviceRequestRepository.findByFilters({
          searchTerm,
          status
        })
    };
  }
}
