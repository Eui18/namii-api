import app from "./app";
import { pool } from "./config/database";
import { env } from "./config/env";

async function start(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log("Conexión a MySQL establecida correctamente");

    const server = app.listen(
      env.port,
      "0.0.0.0",
      () => {
        console.log(
          `Ñamii API escuchando en el puerto ${env.port}`
        );
      }
    );

    const shutdown = async () => {
      console.log("Cerrando servidor...");

      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("No se pudo iniciar la API:", error);
    await pool.end();
    process.exit(1);
  }
}

start();