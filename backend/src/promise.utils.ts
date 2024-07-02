export function onlyFulfilledPromises<T>(promises: Array<Promise<T>>) {
  return Promise.allSettled(promises)
    .then(resolved => resolved
      .filter(promise => promise.status === "fulfilled")
      .map(promise => (promise as PromiseFulfilledResult<T>).value)
    )
}