import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBusRoutesFromCsv, serializeBusRoutes, type BusRoute } from './bus-data.ts';

test('CSV serialization round-trips commas, quotes, and line breaks in route descriptions and stops', () => {
  const routes: BusRoute[] = [{
    id: '42',
    busNumber: '7A',
    description: 'City, "Express"\nvia Market Road',
    stops: ['State Bank', 'Market, "Main"\nRoad', 'Kuloor'],
  }];

  assert.deepEqual(parseBusRoutesFromCsv(serializeBusRoutes(routes)), routes);
});

test('CSV parser supports CRLF records and quoted line breaks', () => {
  const csv = 'id,busNumber,description,stops\r\n42,7A,"City\r\nExpress","State Bank;Market, ""Main"""\r\n';

  assert.deepEqual(parseBusRoutesFromCsv(csv), [{
    id: '42',
    busNumber: '7A',
    description: 'City\r\nExpress',
    stops: ['State Bank', 'Market, "Main"'],
  }]);
});
