import { randomInt } from "crypto";

const LOWER = "abcdefghjkmnpqrstuvwxyz"; // no i/l/o - avoids visual ambiguity
const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "23456789"; // no 0/1 - avoids confusion with O/I
const SYMBOLS = "!@#$%^&*";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function randomChar(charset: string): string {
  return charset[randomInt(charset.length)] as string;
}

// Generates a one-time temporary password for invited users. This is only
// ever hashed and stored, never returned to the caller or logged - the
// employee sets their own real password via the invitation-acceptance flow
// (see invitation.service.ts's acceptInvitation), so this value's only job
// is to satisfy the password-strength constraint on a row the employee can
// never actually log in with (the account stays unverified/invitation-only
// until they do).
export function generateTemporaryPassword(length = 16): string {
  const required = [randomChar(LOWER), randomChar(UPPER), randomChar(DIGITS), randomChar(SYMBOLS)];
  const rest = Array.from({ length: length - required.length }, () => randomChar(ALL));

  const chars = [...required, ...rest];

  // Fisher-Yates shuffle so the guaranteed-category characters aren't
  // always in the same first-four positions.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);

    [chars[i], chars[j]] = [chars[j] as string, chars[i] as string];
  }

  return chars.join("");
}
