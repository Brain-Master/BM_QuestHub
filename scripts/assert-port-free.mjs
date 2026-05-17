import net from "node:net";
import process from "node:process";

const port = Number(process.argv[2] ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid port: ${process.argv[2]}`);
  process.exit(1);
}

const server = net.createServer();

server.once("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Run "make dev-restart" to reclaim it, or reuse the existing dev server.`,
    );
    process.exit(1);
  }

  throw error;
});

server.listen(port, "0.0.0.0", () => {
  server.close(() => process.exit(0));
});
