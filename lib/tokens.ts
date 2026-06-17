import { nanoid } from "nanoid";

export function createToken() {
  return nanoid(48);
}

export function createExpiryDate(hoursFromNow: number) {
  const expires = new Date();
  expires.setHours(expires.getHours() + hoursFromNow);
  return expires;
}

export function isExpired(date: Date) {
  return date.getTime() < Date.now();
}