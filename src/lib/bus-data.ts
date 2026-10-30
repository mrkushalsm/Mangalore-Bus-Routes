import { promises as fs } from 'fs';
import path from 'path';

export type BusRoute = {
  id: string;
  busNumber: string;
  description: string;
  stops: string[];
};

function parseCsvRecords(csvContent: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];

    if (inQuotes) {
      if (char === '"') {
        if (csvContent[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.length === 0) {
      inQuotes = true;
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\r' || char === '\n') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
      if (char === '\r' && csvContent[i + 1] === '\n') i++;
    } else if (char === '"') {
      throw new Error('Invalid quote in unquoted CSV field.');
    } else {
      field += char;
    }
  }

  if (inQuotes) {
    throw new Error('Unterminated quoted CSV field.');
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records;
}

function serializeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function getBusRoutes(): Promise<BusRoute[]> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'bus-data.csv');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return parseBusRoutesFromCsv(fileContent);
}

/**
 * Parse CSV content string into BusRoute array (no filesystem needed).
 * Used by the API route which receives CSV content from GitHub API.
 */
export function parseBusRoutesFromCsv(csvContent: string): BusRoute[] {
  const records = parseCsvRecords(csvContent);
  const routes: BusRoute[] = [];

  for (const parts of records.slice(1)) {
    if (parts.every(part => part.length === 0)) continue;

    if (parts.length >= 4) {
      const [id, busNumber, description, stopsString] = parts;
      const stops = stopsString.split(';').map(stop => stop.trim()).filter(stop => stop.length > 0);
      routes.push({ id, busNumber, description, stops });
    }
  }

  return routes;
}

/**
 * Serialize BusRoute array back to CSV string.
 * Inverse of parseBusRoutesFromCsv / getBusRoutes.
 */
export function serializeBusRoutes(routes: BusRoute[]): string {
  const header = 'id,busNumber,description,stops';
  const lines = routes.map(route => {
    const stops = route.stops.join(';');
    return [route.id, route.busNumber, route.description, stops].map(serializeCsvField).join(',');
  });
  return [header, ...lines].join('\n') + '\n';
}