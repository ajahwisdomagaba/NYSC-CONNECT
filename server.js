import express from 'express';
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv';
import apiRouter from './src/routes/index.js'
import { response } from 'express';
import connectDB from './src/config/db.js';

dotenv.config();

const app = express()

// Connect to MongoDB
connectDB();

//Base Security and Parsing Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

//API vi Namespace
app.use('/api/v1', apiRouter);

//API Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success', message: 'Nysc Connect api is healthy'
  });
});

//404 Catch-all Route
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Endpoint ${req.originalUrl} not found on this server`

  })
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> {
  console.log(`Server is runninG in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;