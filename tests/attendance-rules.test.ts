import assert from "node:assert/strict";
import test from "node:test";

import { calculateAttendance, toPercentage } from "../src/services/attendance.service";
import { assertWithinAttendanceRadius, distanceBetweenCoordinates } from "../src/lib/attendance-location";

test("attendance counts present and late as attended", () => {
  const result = calculateAttendance({ present: 3, absent: 1, late: 1, excused: 0 });
  assert.equal(result.attended, 4);
  assert.equal(result.eligibleSessions, 5);
  assert.equal(result.attendancePercentage, 80);
});

test("excused sessions remain part of sessions held", () => {
  const result = calculateAttendance({ present: 2, absent: 1, late: 0, excused: 2 });
  assert.equal(result.eligibleSessions, 5);
  assert.equal(result.attendancePercentage, 40);
  assert.equal(result.lowAttendance, true);
});

test("empty attendance has no percentage", () => {
  assert.equal(toPercentage(0, 0), null);
});

test("attendance location accepts a student inside the configured radius", () => {
  const result = assertWithinAttendanceRadius({
    lecturerLatitude: 6.5244,
    lecturerLongitude: 3.3792,
    studentLatitude: 6.5248,
    studentLongitude: 3.3795,
    studentAccuracy: 10,
    allowedRadius: 100,
  });
  assert.equal(result.allowedRadius, 100);
  assert.equal(result.distance <= 100, true);
});

test("attendance location rejects an outside student and poor GPS accuracy", () => {
  assert.throws(() => assertWithinAttendanceRadius({
    lecturerLatitude: 6.5244,
    lecturerLongitude: 3.3792,
    studentLatitude: 6.53,
    studentLongitude: 3.39,
    studentAccuracy: 10,
    allowedRadius: 100,
  }), /outside the allowed attendance location/);
  assert.throws(() => assertWithinAttendanceRadius({
    lecturerLatitude: 6.5244,
    lecturerLongitude: 3.3792,
    studentLatitude: 6.5244,
    studentLongitude: 3.3792,
    studentAccuracy: 101,
    allowedRadius: 100,
  }), /reliable GPS/);
});

test("distance calculation returns zero for identical coordinates", () => {
  assert.equal(distanceBetweenCoordinates({ latitude: 6.5244, longitude: 3.3792 }, { latitude: 6.5244, longitude: 3.3792 }), 0);
});
