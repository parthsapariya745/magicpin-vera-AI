const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { scope, context_id, version, payload, delivered_at } = req.body;

  if (!scope || !context_id || version === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!global.contexts[scope]) {
    global.contexts[scope] = new Map();
  }

  const existing = global.contexts[scope].get(context_id);
  
  // Idempotent: higher version replaces atomically
  if (!existing || version > existing.version) {
    global.contexts[scope].set(context_id, {
      version,
      payload,
      delivered_at
    });
  }

  res.status(200).json({
    accepted: true,
    ack_id: `ack_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    stored_at: new Date().toISOString()
  });
});

module.exports = router;
