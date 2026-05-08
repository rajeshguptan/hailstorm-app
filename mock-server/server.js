const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store using Map
const usersStore = new Map();

// Initialize with some sample data
let userIdCounter = 1;
usersStore.set(userIdCounter, {
  id: userIdCounter,
  name: 'Jane Doe',
  email: 'jane@example.com',
  createdAt: new Date().toISOString()
});

// Token bucket store for rate limiting
const tokenBuckets = new Map();

// Token Bucket implementation for rate limiting
class TokenBucket {
  constructor(rps) {
    this.capacity = rps; // Maximum tokens (burst capacity)
    this.tokens = rps; // Current tokens
    this.rps = rps; // Refill rate per second
    this.lastRefill = Date.now(); // Last refill timestamp
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.rps;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  consume() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  // Update RPS rate
  setRps(newRps) {
    this.rps = newRps;
    this.capacity = newRps;
    // Don't change current tokens, but cap at new capacity
    this.tokens = Math.min(this.tokens, this.capacity);
  }
}

// Rate limiting middleware
function rateLimit(req, res, next) {
  const requestId = req.headers['x-request-id'] || req.path;
  const rps = parseFloat(req.headers['x-rps']) || 0;

  // If no RPS set, skip rate limiting
  if (!rps || rps <= 0) {
    return next();
  }

  // Get or create token bucket for this request
  if (!tokenBuckets.has(requestId)) {
    tokenBuckets.set(requestId, new TokenBucket(rps));
  }

  const bucket = tokenBuckets.get(requestId);

  // Update RPS if it changed
  if (bucket.rps !== rps) {
    bucket.setRps(rps);
  }

  // Try to consume a token
  if (bucket.consume()) {
    console.log(`[RATE LIMIT] ${requestId}: ALLOWED (${bucket.tokens.toFixed(2)} tokens remaining)`);
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': bucket.capacity.toString(),
      'X-RateLimit-Remaining': Math.floor(bucket.tokens).toString(),
      'X-RateLimit-Reset': Math.ceil((bucket.lastRefill + 1000) / 1000).toString()
    });
    next();
  } else {
    console.log(`[RATE LIMIT] ${requestId}: RATE LIMITED (${bucket.tokens.toFixed(2)} tokens available)`);
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(1 / rps),
      currentRps: rps
    });
  }
}

// Routes

// GET /users - Return list of all users
app.get('/users', rateLimit, (req, res) => {
  console.log('[MOCK] GET /users');
  const users = Array.from(usersStore.values());
  res.json(users);
});

// POST /users - Create a new user
app.post('/users', rateLimit, (req, res) => {
  console.log('[MOCK] POST /users', req.body);

  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: 'Name and email are required'
      });
    }

    const newUser = {
      id: ++userIdCounter,
      name,
      email,
      createdAt: new Date().toISOString()
    };

    usersStore.set(newUser.id, newUser);

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /upload - Handle file uploads
app.post('/upload', rateLimit, upload.single('file'), (req, res) => {
  console.log('[MOCK] POST /upload');

  try {
    const { description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    // Simulate file processing
    const uploadResult = {
      success: true,
      filename: file.originalname,
      size: file.size,
      description: description || 'No description provided',
      uploadedAt: new Date().toISOString()
    };

    console.log('File uploaded:', uploadResult);

    res.status(200).json({
      message: 'File uploaded successfully',
      data: uploadResult
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set RPS for a specific request
app.post('/rps/:requestId', (req, res) => {
  const { requestId } = req.params;
  const { rps } = req.body;

  if (typeof rps !== 'number' || rps < 0) {
    return res.status(400).json({
      error: 'RPS must be a non-negative number'
    });
  }

  if (!tokenBuckets.has(requestId)) {
    tokenBuckets.set(requestId, new TokenBucket(rps));
  } else {
    tokenBuckets.get(requestId).setRps(rps);
  }

  console.log(`[RPS] Set ${requestId} to ${rps} RPS`);
  res.json({
    requestId,
    rps,
    message: 'RPS updated successfully'
  });
});

// Get RPS status for all requests
app.get('/rps', (req, res) => {
  const status = {};
  for (const [requestId, bucket] of tokenBuckets.entries()) {
    status[requestId] = {
      rps: bucket.rps,
      tokens: bucket.tokens,
      capacity: bucket.capacity,
      lastRefill: new Date(bucket.lastRefill).toISOString()
    };
  }
  res.json(status);
});

// Health check endpoint
app.get('/health', (req, res) => {
  const rateLimitInfo = {};
  for (const [requestId, bucket] of tokenBuckets.entries()) {
    rateLimitInfo[requestId] = {
      rps: bucket.rps,
      tokens: Math.round(bucket.tokens * 100) / 100,
      capacity: bucket.capacity
    };
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    usersCount: usersStore.size,
    rateLimiting: rateLimitInfo
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Users endpoint: http://localhost:${PORT}/users`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/upload`);
  console.log(`⚡ Rate limiting: http://localhost:${PORT}/rps`);
  console.log(`📝 Set RPS: POST http://localhost:${PORT}/rps/{requestId}`);
});