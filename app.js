import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();

import connectDB from "./config/config.db.js";
import { setupMiddlewares } from './middlewares/index.middleware.js';
const PORT = process.env.PORT || 3000;

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Setup middlewares
setupMiddlewares(app);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

//Routes
import indexRouter from './routes/index.route.js';
import usersRouter from './routes/users.route.js';

app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  next();
});

app.use('/', indexRouter);
app.use('/auth', usersRouter);

app.use((req, res) => {
  return res.status(404).send('Route Not Found');
});

app.listen(PORT, connectDB(), () => {
  console.log(`Listening on http://localhost:${PORT}`);
})
