import type { PersonRow } from '#repository/person.repository.ts';
import type { PersonSchema } from '#schema/person.schema.ts';

export const mapPersonRowToPerson = (row: PersonRow): PersonSchema => ({
  id: row.id,
  name: row.name,
  surname: row.surname,
  age: row.age ?? null,
  createdAt: row.created_at.toISOString(),
});
