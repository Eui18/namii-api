import { createServer } from "node:http";
import app from "./app";
import { pool } from "./config/database";
import { env } from "./config/env";

async function start(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log("Conexión a MySQL establecida correctamente");

    const server = createServer(app);

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);

      server.listen(env.port, "0.0.0.0", () => {
        server.off("error", reject);
        resolve();
      });
    });

    console.log(`Ñamii API escuchando en el puerto ${env.port}`);

    let isShuttingDown = false;

    const shutdown = () => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log("Cerrando servidor...");

      server.close(async (error) => {
        if (error) {
          console.error("Error al cerrar el servidor:", error);
          process.exitCode = 1;
        }

        try {
          await pool.end();
        } catch (poolError) {
          console.error("Error al cerrar la conexión con MySQL:", poolError);
          process.exitCode = 1;
        }
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("No se pudo iniciar la API:", error);

    try {
      await pool.end();
    } catch (poolError) {
      console.error("No se pudo cerrar el pool de MySQL:", poolError);
    }

    process.exitCode = 1;
  }
}

void start();