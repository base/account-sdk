export const cleanupSDKLocalStorage = () => {
  // remove all keys that contains 'base-acc-sdk', as well as legacy keys
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('cbwsdk.') || key.startsWith('-CBWSDK:') || key.startsWith('base-acc-sdk')) {
      localStorage.removeItem(key);
    }
  });
};
