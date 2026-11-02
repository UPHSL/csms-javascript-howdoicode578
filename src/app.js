
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

import { notFound } from "./middleware/notFound.js";
import mainRoutes from "./routes/index.js";
import { createDatabase } from "./database/database.js";
import { ResidentRepository } from "./repositories/ResidentRepository.js";

import ResidentQueryService from "./services/ResidentQueryService.js";
import ResidentRegistrationService from "./services/ResidentRegistrationService.js";
import ResidentUpdateService from "./services/ResidentUpdateService.js";
import ResidentDeactivationService from "./services/ResidentDeactivationService.js";
import { ResidentValidator } from "./services/ResidentValidator.js";

import { createResidentController } from "./controllers/residentController.js";
import { createResidentRouter } from "./routes/residents.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

export function createApp(options = {}) {
  const app = express();

  const database = createDatabase(options.databasePath);
  const repository = new ResidentRepository(database);

  const validator = new ResidentValidator();

  const queryService =
    new ResidentQueryService(repository);

  const registrationService =
    new ResidentRegistrationService(
      validator,
      repository
    );

  const updateService =
    new ResidentUpdateService(
      validator,
      repository
    );

  const deactivationService =
    new ResidentDeactivationService(repository);

  const residentController =
    createResidentController({
      repository,
      queryService,
      registrationService,
      updateService,
      deactivationService
    });

  app.disable("x-powered-by");

  app.set(
    "views",
    path.join(currentDirectory, "views")
  );

  app.set("view engine", "ejs");

  app.locals.database = database;

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(
    express.static(
      path.join(currentDirectory, "..", "public")
    )
  );

  app.use(mainRoutes);
  app.use(createResidentRouter(residentController));

  app.use(notFound);

  return app;
}
