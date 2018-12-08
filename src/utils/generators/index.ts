export async function getAllAsyncGeneratorResults<T>(
  generator: AsyncIterableIterator<T>,
) {
  const results: T[] = [];
  for await (const result of generator) {
    results.push(result);
  }
  return results;
}
