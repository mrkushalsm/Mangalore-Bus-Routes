import { promises as fs } from 'fs';
import path from 'path';

export type BusRoute = {
  id: string;
  busNumber: string;
  description: string;
  stops: string[];
};

export async function getBusRoutes(): Promise<BusRoute[]> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'bus-data.csv');
  const fileContent = await fs.readFile(filePath, 'utf-8');

  const lines = fileContent.split('\n');
  const routes: BusRoute[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Manual CSV parsing to handle quoted fields containing delimiters
    const parts: string[] = [];
    let currentPart = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(currentPart);
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart);

    if (parts.length >= 4) {
      const id = parts[0];
      const busNumber = parts[1];
      // Remove surrounding quotes if present
      const description = parts[2].replace(/^"|"$/g, '');
      const stopsString = parts[3].replace(/^"|"$/g, '');

      const stops = stopsString.split(';').map(s => s.trim()).filter(s => s.length > 0);

      routes.push({
        id,
        busNumber,
        description,
        stops
      });
    }
  }

  return routes;
}