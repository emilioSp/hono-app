import type { Knex } from 'knex';
import { v7 as uuidv7 } from 'uuid';
import { logger } from '#logger';
import { getDB } from './db.ts';

type CreatePersonDbInput = {
  name: string;
  surname: string;
  age?: number | null;
};

export type PersonRow = {
  id: string;
  name: string;
  surname: string;
  age: number | null;
  created_at: Date;
};

export const insertPerson = async (
  data: CreatePersonDbInput,
  trx?: Knex.Transaction,
): Promise<PersonRow> => {
  logger.debug({
    message: 'Inserting person into database',
    data: { name: data.name, surname: data.surname, age: data.age ?? null },
  });

  const db = getDB(trx);
  const [row] = await db<PersonRow>('people')
    .insert({
      id: uuidv7(),
      name: data.name,
      surname: data.surname,
      age: data.age ?? null,
    })
    .returning('*');

  return row;
};

export const selectPeople = async (id?: string): Promise<PersonRow[]> => {
  logger.debug({
    message: 'Selecting people from database',
    data: { id: id ?? 'all' },
  });

  const db = getDB()('people')
    .select('id', 'name', 'surname', 'age', 'created_at')
    .orderBy('created_at', 'desc');

  if (id) {
    db.where({ id });
  }

  const person = await db;
  return person;
};
