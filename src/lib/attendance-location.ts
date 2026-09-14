const EARTH_RADIUS_METERS = 6_371_000;
const DEFAULT_ATTENDANCE_RADIUS_METERS = 100;
const MAX_LOCATION_ACCURACY_METERS = 100;

export const attendanceRadiusMeters = Number(process.env.ATTENDANCE_RADIUS_METERS) > 0
  ? Number(process.env.ATTENDANCE_RADIUS_METERS)
  : DEFAULT_ATTENDANCE_RADIUS_METERS;

export function validateCoordinates(latitude: number, longitude: number, accuracy: number) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
    && Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= MAX_LOCATION_ACCURACY_METERS;
}

export function distanceBetweenCoordinates(first: { latitude: number; longitude: number }, second: { latitude: number; longitude: number }) {
  const toRadians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function assertWithinAttendanceRadius(input: {
  lecturerLatitude: number | null;
  lecturerLongitude: number | null;
  studentLatitude: number;
  studentLongitude: number;
  studentAccuracy: number;
  allowedRadius?: number | null;
}) {
  if (input.lecturerLatitude === null || input.lecturerLongitude === null) {
    throw new Error("This attendance session has no location anchor.");
  }
  if (!validateCoordinates(input.studentLatitude, input.studentLongitude, input.studentAccuracy)) {
    throw new Error("Location access is required with a reliable GPS reading to mark attendance.");
  }
  const distance = distanceBetweenCoordinates(
    { latitude: input.lecturerLatitude, longitude: input.lecturerLongitude },
    { latitude: input.studentLatitude, longitude: input.studentLongitude },
  );
  const allowedRadius = input.allowedRadius ?? attendanceRadiusMeters;
  if (distance > allowedRadius) throw new Error("You are outside the allowed attendance location. Please move closer and try again.");
  return { distance, allowedRadius };
}