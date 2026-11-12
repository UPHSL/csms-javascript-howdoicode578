
# CSMS Application Architecture

## Overview

The Community Services Management System (CSMS) is a JavaScript web application built with Node.js, Express.js, EJS, and SQLite.

The application follows a layered structure that separates HTTP handling, business logic, database operations, and presentation.

## Project Structure

```text
src/
├── app.js
├── server.js
├── config/
├── controllers/
├── database/
├── middleware/
├── models/
├── repositories/
├── routes/
├── services/
├── utils/
└── views/

public/
└── css/

test/
docs/
data/
```

## Layer Responsibilities

### Application and Server

- `app.js` configures the Express application and its middleware.
- `server.js` starts the HTTP server.

### Configuration and Database

- `config/` contains application configuration.
- `database/` contains SQLite database initialization and connection logic.

### Routes and Controllers

- `routes/` maps HTTP endpoints to controller functions.
- `controllers/` handles incoming requests, invokes application services, and prepares HTTP responses.

### Services

- `services/` contains application rules and business operations, including resident management, service request management, and dashboard queries.

### Repositories

- `repositories/` handles database access and persistence.
- SQL operations use parameterized statements for user-provided values.

### Models

- `models/` represents the Resident and Service Request domain entities.

### Middleware and Utilities

- `middleware/` contains reusable request-processing behavior.
- `utils/` contains shared validation and supporting functions.

### Views and Static Assets

- `views/` contains EJS templates for the application interface.
- `public/` contains browser-accessible static assets, including CSS.

### Tests

- `test/` contains automated tests for application behavior, services, repositories, routes, and interfaces.

## Request Flow

```text
HTTP Request
     |
     v
Express Route
     |
     v
Controller
     |
     v
Service
     |
     v
Repository
     |
     v
SQLite Database
     |
     v
Controller Response / EJS View
```

Not every operation requires every layer. Responsibilities should remain separated without introducing unnecessary complexity.

## Main Application Areas

### Resident Management

Supports resident registration, searching, viewing, updating, and deactivation.

Resident records remain persisted after deactivation.

### Service Request Management

Supports service request submission, searching, viewing, and status management.

Status transitions follow the established application workflow and prevent invalid or terminal-state changes.

### Dashboard

Provides summary information and recent service request data using database queries.

### Health Check

The `/health` endpoint provides an application health response.

## Development Principles

- Preserve existing application behavior when implementing changes.
- Keep business rules in the service layer.
- Keep database operations in repositories.
- Validate user input before processing mutations.
- Use parameterized SQL statements.
- Use appropriate HTTP methods for read and mutation operations.
- Keep automated tests isolated and repeatable.
- Avoid introducing features outside the assigned project scope.