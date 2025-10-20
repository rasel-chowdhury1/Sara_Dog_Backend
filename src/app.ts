/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import globalErrorHandler from './app/middleware/globalErrorhandler';
import notFound from './app/middleware/notfound';
import router from './app/routes';
import serverHomePage from './app/helpers/serverHomePage';
import { logErrorHandler, logHttpRequests } from './app/utils/logger';
import rateLimit from 'express-rate-limit';

const app: Application = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

//parsers
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    // origin: true,
    origin: 'https://woofspot.net',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  }),
);

// // 🟢 CORS setup
// const corsOptions = {
//   origin: 'https://woofspot.net', 
//   credentials: true,              // allow cookies/auth headers
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
// };

// app.use(cors(corsOptions));

// Handle preflight OPTIONS requests globally
// app.options('*', cors(corsOptions));


app.use(logHttpRequests);

// ✅ Add this line before rate limiter or any middleware using IP
app.set('trust proxy', 1); // Trust first proxy (needed for Nginx/PM2 setup)

// 👮 Rate Limiter Middleware (apply to all requests)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000000, // limit each IP to 100 requests per 15 min
  message: "🚫 Too many requests from this IP. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter); // 👈 Add before your routes



// Remove duplicate static middleware
// app.use(app.static('public'));

// application routes
app.use('/api/v1', router);

app.get('/', async (req: Request, res: Response) => {
  const htmlContent = await serverHomePage();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(htmlContent);
});

// Error handler middleware
app.use(logErrorHandler);
app.use(globalErrorHandler);

//Not Found
app.use(notFound);

export default app;
