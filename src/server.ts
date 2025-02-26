/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createServer, Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './app/config';
import initializeSocketIO from './socketio';
import seedAdmin from './app/DB';
//@ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const colors = require('colors');

let server: Server;
export const io = initializeSocketIO(createServer(app));
// export const io = initializeSocketIO(createServer(app));

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    seedAdmin();
    server = app.listen(Number(config.port), config.ip as string, () => {
      //@ts-ignore
      console.log(`app is listening on ${config.ip}:${config.port}`.green.bold);
    });
    io.listen(Number(config.socket_port));
    console.log(
      //@ts-ignore
      `Socket is listening on port ${config.ip}:${config.socket_port}`.yellow
        .bold,
    );
  } catch (err) {
    console.error(err);
  }
}
main();

// Graceful shutdown for unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection detected: ${err}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1); // Ensure process exits
});

// Graceful shutdown for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught exception detected: ${err}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
});
