// Web fallback for expo-location
export const LocationAccuracy = {
  Balanced: 4,
  High: 6,
  Low: 1,
  Lowest: 0,
};

export async function requestForegroundPermissionsAsync() {
  if ('geolocation' in navigator) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ status: 'granted' }),
        () => resolve({ status: 'denied' })
      );
    });
  }
  return { status: 'denied' };
}

export async function getCurrentPositionAsync(options: any = {}) {
  if ('geolocation' in navigator) {
    return new Promise<any>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
              heading: position.coords.heading,
            },
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: options.accuracy === LocationAccuracy.High,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }
  throw new Error('Geolocation not supported');
}

export { LocationAccuracy as Accuracy };
