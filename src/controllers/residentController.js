
import { Resident } from "../models/Resident.js";

/**
 * Create Resident Management controller handlers.
 *
 * @param {object} dependencies Application services and repository.
 */
export function createResidentController({
  repository,
  queryService,
  registrationService,
  updateService,
  deactivationService
}) {
  function getFormInformation(request) {
    return {
      firstName: request.body.firstName ?? "",
      lastName: request.body.lastName ?? "",
      address: request.body.address ?? "",
      contactNumber: request.body.contactNumber ?? "",
      email: request.body.email ?? ""
    };
  }

  function showResidents(request, response) {
    const searchTerm =
      typeof request.query.search === "string"
        ? request.query.search
        : "";

    const residents =
      queryService.searchResidents(searchTerm);

    response.status(200).render("residents/index", {
      residents,
      searchTerm,
      message: request.query.message ?? ""
    });
  }

  function showRegistrationForm(request, response) {
    response.status(200).render("residents/new", {
      resident: {},
      errors: [],
      errorMessage: ""
    });
  }

  function registerResident(request, response) {
    const information = getFormInformation(request);

    const resident = new Resident({
      ...information,
      status: "Active"
    });

    const result =
      registrationService.registerResident(resident);

    if (!result.success) {
      return response.status(400).render("residents/new", {
        resident: information,
        errors: result.errors,
        errorMessage: "Please correct the highlighted information."
      });
    }

    return response.redirect(
      "/residents?message=Resident%20registered%20successfully"
    );
  }

  function showEditForm(request, response) {
    const residentId = Number(request.params.id);

    if (!Number.isInteger(residentId) || residentId <= 0) {
      return response.status(404).render("residents/not-found");
    }

    const resident = repository.findById(residentId);

    if (!resident) {
      return response.status(404).render("residents/not-found");
    }

    return response.status(200).render("residents/edit", {
      resident,
      errors: [],
      errorMessage: ""
    });
  }

  function updateResident(request, response) {
    const residentId = Number(request.params.id);

    if (!Number.isInteger(residentId) || residentId <= 0) {
      return response.status(404).render("residents/not-found");
    }

    const information = getFormInformation(request);

    const result =
      updateService.updateResident(
        residentId,
        information
      );

    if (result.notFound) {
      return response.status(404).render("residents/not-found");
    }

    if (!result.success) {
      const existingResident =
        repository.findById(residentId);

      return response.status(400).render("residents/edit", {
        resident: {
          ...existingResident,
          ...information,
          id: existingResident.id,
          status: existingResident.status
        },
        errors: result.errors,
        errorMessage: "Please correct the highlighted information."
      });
    }

    return response.redirect(
      "/residents?message=Resident%20updated%20successfully"
    );
  }

  function deactivateResident(request, response) {
    const residentId = Number(request.params.id);

    if (!Number.isInteger(residentId) || residentId <= 0) {
      return response.status(404).render("residents/not-found");
    }

    const result =
      deactivationService.deactivateResident(residentId);

    if (!result.success) {
      return response.status(404).render("residents/not-found");
    }

    const message =
      result.status === "ALREADY_INACTIVE"
        ? "Resident is already inactive"
        : "Resident deactivated successfully";

    return response.redirect(
      `/residents?message=${encodeURIComponent(message)}`
    );
  }

  return {
    showResidents,
    showRegistrationForm,
    registerResident,
    showEditForm,
    updateResident,
    deactivateResident
  };
}