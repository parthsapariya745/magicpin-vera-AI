const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - (global.startTime || Date.now())) / 1000);
  
  res.status(200).json({
    status: 'ok',
    uptime_seconds: uptimeSeconds,
    contexts_loaded: {
      category: global.contexts.category.size,
      merchant: global.contexts.merchant.size,
      customer: global.contexts.customer.size,
      trigger: global.contexts.trigger.size
    }
  });
});

module.exports = router;
