/**
 * Create Dashboard controller handlers.
 *
 * @param {object} dependencies Dashboard query service.
 */
export function createDashboardController({
  dashboardQueryService
}) {
  function showDashboard(request, response) {
    const dashboardData =
      dashboardQueryService.getDashboardData();

    return response.status(200).render(
      "dashboard",
      dashboardData
    );
  }

  return {
    showDashboard
  };
}