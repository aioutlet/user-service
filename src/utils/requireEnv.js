// Utility to require environment variables and throw a clear error if missing
export function requireEnv(varName) {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`FATAL: Required environment variable ${varName} is not set. Please set it in your .env file.`);
  }
  return value;
}

// Check multiple required environment variables
export function checkRequiredEnv(varNames) {
  for (const name of varNames) {
    requireEnv(name);
  }
}
