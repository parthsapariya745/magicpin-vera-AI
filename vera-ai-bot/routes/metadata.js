const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    name: "Parth Sapariya",
    team_name: "Parth Sapariya",
    description: "AI growth assistant for merchants",
    model: "gpt-4o-mini",
    version: "1.0"
  });
});

module.exports = router;
