/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createServer, Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './app/config';
import initializeSocketIO from './socketio';
import seedAdmin from './app/DB';
import { logger } from './app/utils/logger';
//@ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
const colors = require('colors');

let server: Server;
export const io = initializeSocketIO(createServer(app));
// export const io = initializeSocketIO(createServer(app));

async function main() {
  try {
    const dbStartTime = Date.now();
    const loadingFrames = ["🌍", "🌎", "🌏"]; // Loader animation frames
    let frameIndex = 0;

    // Start the connecting animation
    const loader = setInterval(() => {
      process.stdout.write(
        `\rMongoDB connecting ${loadingFrames[frameIndex]} Please wait 😢`,
      );
      frameIndex = (frameIndex + 1) % loadingFrames.length;
    }, 300); // Update frame every 300ms



    // Connect to MongoDB with a timeout
    await mongoose.connect(config.database_url as string, {
      connectTimeoutMS: 10000, // 10 seconds timeout
    });

        // Stop the connecting animation
    clearInterval(loader);
    logger.info(
      `\r✅ Mongodb connected successfully in ${Date.now() - dbStartTime}ms`,
    );

    seedAdmin();
    server = app.listen(Number(config.port), config.ip as string, () => {
      //@ts-ignore
      // console.log(`app is listening on ${config.ip}:${config.port}`.green.bold);
      console.log(
        colors.green(`---> Sara server is listening on  : http://${config.ip}:${config.port}`).bold,
      );
    });
    io.listen(Number(config.socket_port));
    // console.log(
    //   //@ts-ignore
    //   `Socket is listening on port ${config.ip}:${config.socket_port}`.yellow
    //     .bold,
    // );
    console.log(
      //@ts-ignore
      `---> Socket server is listening on : http://${config.ip}:${config.socket_port}`.yellow
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
