Developer Information

Name: Azra Raphael T. Prugalidad
GitHub Username: howdoicode578
Primary Technology Stack: JavaScript with Express.js
T03 Branch: feature/t03-resident-persistence


My T03 Implementation

Explain in approximately 5 to 8 sentences:
    The SQLite database is stored as a file named residents.db inside the project's local data/ directory. The ResidentRepository class in located in ResidentRepository.js handles Resident persistence. When save() is called, it uses a prepared SQL INSERT statement to store the Resident's information in the SQLite database. SQLite then generates the Resident ID automatically, auto incrementing, and the generated ID is obtained using lastInsertRowid. The ID is then assigned to the generated Resident object, and findByID() uses a prepared SELECT statement as the Resident ID as a parameter to convert the database row back into a Resident object.


My Persistence Design Decision

Describe one persistence-related design decision
you personally made.

    I decided to keep database connection and the initialization of the table in a separate file, database.js module instead of placing the database logic inside the app.js. This is to ensure that database responsibilities are kept separate from the Express application, allowing for easier maintenance and consistent database connection. The database module would then accept a custom database path, allowing automated tests to use temporary SQLite database files without affecting the actual database.


My Database Initialization Design

Database initialization file or module:
    Database initialization file or module is found in src/database/database.js

    Where the default path comes from: The default path is data/residents.db

    How the Resident table is initialized: The database uses a CREATE TABLE statement when the database connection is created

    How repeated initialization is handled: The table uses CREATE TABLE IF NOT EXISTS so running initialization multiple times does not destroy existing records.

    This was designed so that the setup happens in one location only, and that the application and repository do not need to duplicate database configuration.


Files I Changed

File: src/database/database.js
Purpose: Opens the file-backed SQLite database and initializes the Resident table

File: src/repositories/ResidentRepository.js
Purpose: Uses save() and findById() operations and maps database rows to Resident objects

File: test/residentRepository.test.js
Purpose: Tests Resident persistence, generated IDs, retrieval, missing records, real file persistence, and the student-designed test


SQL I Can Explain

Copy ONE SQL statement that you personally wrote for T03.

Explain:
- What the statement does.
- What each placeholder or parameter represents.
- Which repository operation uses it.

INSERT INTO residents (
  first_name,
  last_name,
  address,
  contact_number,
  email,
  status
)
VALUES (?, ?, ?, ?, ?, ?)

    This statement inserts a Resident's information into the residents table. In order, the question marks represents the first_name, last_name, address, contact_number, email, and status, and applied separately through the statement instead of being added directly to the SQL.

My Resident Mapping

Explain how one SQLite Resident row becomes
an instance of the existing Resident model.

Mention at least one database column whose name
differs from the JavaScript property name.

    When findById() retrieves a row, the repository then creates a new isntance of the existing Resident model using the values it took from the database. The repository then converts the database column names into the JavaScript property names, or in the camel format, such as first_name being renamed to firstName.


Problem I Encountered

Problem or error: 
Cause:
How I resolved it:


My Student-Designed Test

Test name: assigns different identifiers to separately persisted Residents
What it verifies: It verifies that two separately saved Residents receive different generated IDs
Why I chose this scenario: This is to verify that the repository's SQLite ID generation works instead of accidentally reusing or manually assigning the same identifier.


Tools and References Used

List the documentation, references, search resources,
IDE tools, AI tools, or coding assistants you used.

If AI or a coding assistant was used, briefly state
what it helped you with.

AI has helped me with the test cases. It generated the test cases, as well as guided me through creating the database through Node.js. 