require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-memory store for contexts
global.contexts = {
  category: new Map(),
  merchant: new Map(),
  customer: new Map(),
  trigger: new Map()
};

// Routes
const contextRouter = require('./routes/context');
const tickRouter = require('./routes/tick');
const replyRouter = require('./routes/reply');
const healthzRouter = require('./routes/healthz');
const metadataRouter = require('./routes/metadata');

app.use('/v1/context', contextRouter);
app.use('/v1/tick', tickRouter);
app.use('/v1/reply', replyRouter);
app.use('/v1/healthz', healthzRouter);
app.use('/v1/metadata', metadataRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  global.startTime = Date.now();
  console.log(`Vera AI Bot service listening on port ${port}`);
});
