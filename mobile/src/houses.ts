import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

export type House = {
  id: number;
  longitude: number;
  latitude: number;
  name: string;
  listingUrl: string | null;
  notes: string;
  accessScore: number | null;
};

export type HouseDetails = Pick<House, 'name' | 'listingUrl' | 'notes' | 'accessScore'>;
type HouseLocation = Pick<House, 'longitude' | 'latitude'>;

export async function openHouseDatabase() {
  const db = await openDatabaseAsync('reflo.db');
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS houses (
        id INTEGER PRIMARY KEY,
        longitude REAL NOT NULL,
        latitude REAL NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        listingUrl TEXT,
        notes TEXT NOT NULL DEFAULT '',
        accessScore INTEGER CHECK (
          accessScore IS NULL OR (typeof(accessScore) = 'integer' AND accessScore BETWEEN 0 AND 10)
        )
      );
    `);
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

export function listHouses(db: SQLiteDatabase) {
  return db.getAllAsync<House>(`
    SELECT id, longitude, latitude, name, listingUrl, notes, accessScore
    FROM houses ORDER BY id DESC
  `);
}

export async function saveHouse(
  db: SQLiteDatabase,
  location: HouseLocation,
  details: HouseDetails,
  id?: number,
): Promise<House> {
  const { name, listingUrl, notes, accessScore } = details;
  if (id === undefined) {
    const result = await db.runAsync(
      'INSERT INTO houses (longitude, latitude, name, listingUrl, notes, accessScore) VALUES (?, ?, ?, ?, ?, ?)',
      location.longitude, location.latitude, name, listingUrl, notes, accessScore,
    );
    return { id: result.lastInsertRowId, ...location, ...details };
  }

  await db.runAsync(
    'UPDATE houses SET name = ?, listingUrl = ?, notes = ?, accessScore = ? WHERE id = ?',
    name, listingUrl, notes, accessScore, id,
  );
  return { id, ...location, ...details };
}
