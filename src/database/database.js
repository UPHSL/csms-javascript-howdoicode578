import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const dataDirectory = path.resolve('data');

if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true});
}

const databasePath = path.join(dataDirectory, 'residents.db');

export function createDatabase(customPath = databasePath) {
    const db = new DatabaseSync(customPath);

    db.exec(`
        CREATE TABLE IF NOT EXISTS residents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            address TEXT NOT NULL,
            contact_number TEXT NOT NULL,
            email TEXT NOT NULL,
            status TEXT NOT NULL
            )
        `);

    return db;
}