import assert from "node:assert/strict";
import test from "node:test";

import { canManageCourse } from "../src/services/lecturer.service";

// These pure authorization outcomes remain true even when the database is unavailable.
test("only lecturer roles can manage assigned courses", async () => {
  assert.equal(await canManageCourse("any-user", "STUDENT", "course"), false);
  assert.equal(await canManageCourse("any-user", "ADMIN", "course"), false);
});

test("unsupported roles cannot control attendance", async () => {
  assert.equal(await canManageCourse("any-user", "STUDENT", "course"), false);
});
