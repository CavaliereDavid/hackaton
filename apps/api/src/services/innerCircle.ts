import type { InnerCirclePerson } from "@hackaton/shared";
import {
  addInnerCirclePerson,
  countInnerCircle,
  getInnerCirclePerson,
  listInnerCircle,
  removeInnerCirclePerson,
} from "../db/innerCircle.js";

export class ConflictError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
  }
}

export function listPeople(ownerUserId: string): InnerCirclePerson[] {
  return listInnerCircle(ownerUserId);
}

export function addPerson(
  ownerUserId: string,
  input: { displayName: string; handle?: string; avatarUrl?: string },
): InnerCirclePerson {
  if (countInnerCircle(ownerUserId) >= 10) {
    throw new ConflictError("Inner circle is full (max 10)");
  }
  return addInnerCirclePerson(ownerUserId, input);
}

export function removePerson(id: string): boolean {
  return removeInnerCirclePerson(id);
}

export function getPerson(id: string): InnerCirclePerson | null {
  return getInnerCirclePerson(id);
}
