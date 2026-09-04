import assert from "node:assert/strict";
import test from "node:test";

import { calculateAttendance, toPercentage } from "../src/services/attendance.service";

test("attendance counts present and late as attended", () => {
  const result = calculateAttendance({ present: 3, absent: 1, late: 1, excused: 0 });
  assert.equal(result.attended, 4);
  assert.equal(result.eligibleSessions, 5);
  assert.equal(result.attendancePercentage, 80);
});

test("excused sessions are removed from the denominator", () => {
  const result = calculateAttendance({ present: 2, absent: 1, late: 0, excused: 2 });
  assert.equal(result.eligibleSessions, 3);
  assert.equal(result.attendancePercentage, 66.7);
  assert.equal(result.lowAttendance, true);
});

test("empty attendance has no percentage", () => {
  assert.equal(toPercentage(0, 0), null);
});
