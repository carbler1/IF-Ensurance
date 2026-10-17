// expo-router/testing-library registers this matcher but SDK 57 ships no type for it.
declare namespace jest {
  interface Matchers<R> {
    toHavePathname(pathname: string): R;
  }
}
