export async function loadTextAsset(paths) {
  const failures = [];
  for (const path of paths) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (response.ok) {
        return response.text();
      }
      failures.push(`${path}: ${response.status}`);
    } catch (error) {
      failures.push(`${path}: ${error.message}`);
    }
  }
  throw new Error(`Failed to load asset. Tried ${failures.join("; ")}`);
}
