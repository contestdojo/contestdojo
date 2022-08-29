export default function makePartial<T>(obj: T | undefined): Partial<T> {
  return obj ?? {};
}
