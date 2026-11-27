import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Falta la variable ${name} en el archivo .env`);
  }

  return value;
}

function positiveNumber(name: string, fallback: number, max: number): number {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isInteger(value) || value <= 0 || value > max) {
    throw new Error(`${name} debe ser un número entero entre 1 y ${max}`);
  }

  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "production";

if (!["development", "test", "production"].includes(nodeEnv)) {
  throw new Error("NODE_ENV debe ser development, test o production");
}

export const env = {
  nodeEnv,
  port: positiveNumber("PORT", 3000, 65535),

  db: {
    host: required("DB_HOST"),
    port: positiveNumber("DB_PORT", 3306, 65535),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    name: required("DB_NAME")
  },

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d"
};

if (env.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET debe tener al menos 32 caracteres");
}