const express = require('express');
const router = express.Router();
const aiService = require('../services/ai');

router.post('/', async (req, res, next) => {
  try {
    const { conversation_id, from_role, message, turn_number } = req.body;

    // The bot decides if it should send a message, wait, or end the conversation.
    const replyDecision = await aiService.composeReplyDecision(conversation_id, from_role, message, turn_number);

    res.status(200).json({
      action: replyDecision.action,
      body: replyDecision.body,
      rationale: replyDecision.rationale
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
