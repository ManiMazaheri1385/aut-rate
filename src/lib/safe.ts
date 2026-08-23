/** Run an async loader and fall back to a default value on failure. */
export async function safe<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error("[service] query failed:", error);
    return fallback;
  }
}
