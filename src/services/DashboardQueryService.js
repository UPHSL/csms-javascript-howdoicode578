/**
 * Coordinates read-only dashboard queries.
 *
 * Dashboard statistics are retrieved through repository
 * aggregate queries. Open requests are derived from the
 * existing Pending and In Progress statuses.
 */
export default class DashboardQueryService {
  constructor(
    residentRepository,
    serviceRequestRepository
  ) {
    this.residentRepository = residentRepository;
    this.serviceRequestRepository =
      serviceRequestRepository;
  }

  getDashboardData() {
    const totalResidents =
      this.residentRepository.countAllResidents();

    const activeResidents =
      this.residentRepository.countResidentsByStatus(
        "Active"
      );

    const inactiveResidents =
      this.residentRepository.countResidentsByStatus(
        "Inactive"
      );

    const totalServiceRequests =
      this.serviceRequestRepository.countAllServiceRequests();

    const pendingRequests =
      this.serviceRequestRepository.countServiceRequestsByStatus(
        "Pending"
      );

    const inProgressRequests =
      this.serviceRequestRepository.countServiceRequestsByStatus(
        "In Progress"
      );

    const completedRequests =
      this.serviceRequestRepository.countServiceRequestsByStatus(
        "Completed"
      );

    const cancelledRequests =
      this.serviceRequestRepository.countServiceRequestsByStatus(
        "Cancelled"
      );

    const openRequests =
      pendingRequests + inProgressRequests;

    const recentServiceRequests =
      this.serviceRequestRepository.findRecentServiceRequests(5);

    return {
      residentSummary: {
        total: totalResidents,
        active: activeResidents,
        inactive: inactiveResidents
      },

      serviceRequestSummary: {
        total: totalServiceRequests,
        pending: pendingRequests,
        inProgress: inProgressRequests,
        completed: completedRequests,
        cancelled: cancelledRequests,
        open: openRequests
      },

      recentServiceRequests
    };
  }
}