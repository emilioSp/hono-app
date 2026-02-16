import { logger } from '#logger';
import { mapPersonRowToPerson } from '#mapper/person.mapper.ts';
import { insertPerson, selectPeople } from '#repository/person.repository.ts';
import type { CreatePersonInput, PersonSchema } from '#schema/person.schema.ts';
import { NotFoundError } from '../error/not-found.error.ts';

export const createPerson = async (
  input: CreatePersonInput,
): Promise<PersonSchema> => {
  logger.debug({
    message: 'Creating person',
    data: { name: input.name, surname: input.surname },
  });

  const personRow = await insertPerson({
    name: input.name,
    surname: input.surname,
    age: input.age,
  });

  const person = mapPersonRowToPerson(personRow);
  return person;
};

export const listPeople = async (): Promise<PersonSchema[]> => {
  logger.debug({ message: 'Listing all people' });

  const peopleRows = await selectPeople();
  const people = peopleRows.map(mapPersonRowToPerson);

  return people;
};

export const getPerson = async (id: string): Promise<PersonSchema> => {
  logger.debug({ message: 'Getting person by id', data: { personId: id } });

  const personRow = await selectPeople(id);

  if (personRow.length === 0) {
    logger.warn({ message: 'Person not found', data: { personId: id } });
    throw new NotFoundError({
      message: `Person with id ${id} not found`,
      context: { id },
    });
  }

  return mapPersonRowToPerson(personRow[0]);
};
