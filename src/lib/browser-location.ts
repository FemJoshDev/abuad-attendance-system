export type BrowserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export function getBrowserLocation(): Promise<BrowserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser does not support location services."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
      (error) => reject(new Error(error.code === error.PERMISSION_DENIED
        ? "Location access is required to mark attendance. Please enable location permission and try again."
        : "Unable to obtain a reliable location. Please try again.")),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  });
}
