const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    team_name: "Antigravity Alpha",
    team_members: ["Antigravity"],
    model: "gpt-4o-mini",
    approach: "deterministic routing with context-aware LLM composition",
    version: "1.0.0"
  });
});

module.exports = router;
