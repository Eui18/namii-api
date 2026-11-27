import "dotenv/config";

const nodeEnv = process.env.NODE_ENV ?? (process.env.npm_lifecycle_event === "test" ? "test" : "production");

if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error("NODE_ENV debe ser development, test o production");
}

const isTest = nodeEnv === "test" || process.env.npm_lifecycle_event === "test" || process.argv.includes("--test");

function required(name: string, testFallback?: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    if (isTest && testFallback !== undefined) {
      return testFallback;
    }
    throw new Error("Falta la variable " + name + " en el archivo .env");
  }

  return value;
}

function positiveNumber(name: string, fallback: number, max: number): number {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isInteger(value) || value <= 0 || value > max) {
    throw new Error(name + " debe ser un número entero entre 1 y " + max);
  }

  return value;
}

export const env = {
  nodeEnv,
  port: positiveNumber("PORT", 3000, 65535),

  db: {
    host: required("DB_HOST", "localhost"),
    port: positiveNumber("DB_PORT", 3306, 65535),
    user: required("DB_USER", "namii_test"),
    password: required("DB_PASSWORD", "namii_test_pass"),
    name: required("DB_NAME", "namii_test_db")
  },

  jwtSecret: required("JWT_SECRET", "secreto_seguro_de_prueba_para_pruebas_unitarias_32_chars"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d"
};

if (env.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET debe tener al menos 32 caracteres");
}