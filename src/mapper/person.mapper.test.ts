import { describe, expect, it } from 'vitest';
import type { PersonRow } from '#repository/person.repository.ts';
import { mapPersonRowToPerson } from './person.mapper.ts';

describe('mapPersonRowToPerson', () => {
  it('maps a person row with age to person schema', () => {
    const row: PersonRow = {
      id: '01956789-abcd-7000-8000-123456789abc',
      name: 'John',
      surname: 'Doe',
      age: 30,
      created_at: new Date('2026-02-12T10:00:00.000Z'),
    };

    const result = mapPersonRowToPerson(row);

    expect(result).toEqual({
      id: '01956789-abcd-7000-8000-123456789abc',
      name: 'John',
      surname: 'Doe',
      age: 30,
      createdAt: '2026-02-12T10:00:00.000Z',
    });
  });

  it('maps a person row with null age to person schema', () => {
    const row: PersonRow = {
      id: '01956789-abcd-7000-8000-123456789def',
      name: 'Jane',
      surname: 'Smith',
      age: null,
      created_at: new Date('2026-02-12T11:00:00.000Z'),
    };

    const result = mapPersonRowToPerson(row);

    expect(result).toEqual({
      id: '01956789-abcd-7000-8000-123456789def',
      name: 'Jane',
      surname: 'Smith',
      age: null,
      createdAt: '2026-02-12T11:00:00.000Z',
    });
  });
});
