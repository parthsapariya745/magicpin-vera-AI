const express = require('express');
const router = express.Router();
const aiService = require('../services/ai');

router.post('/', async (req, res, next) => {
  try {
    const { now, available_triggers } = req.body;

    if (!available_triggers || !Array.isArray(available_triggers)) {
      return res.status(400).json({ error: "Missing or invalid available_triggers" });
    }

    const candidateTasks = [];
    
    for (const trigger_id of available_triggers) {
      const triggerContext = global.contexts.trigger.get(trigger_id);
      
      for (const [merchant_id, merchantContext] of global.contexts.merchant.entries()) {
        if (candidateTasks.length >= 20) break;
        
        // Simple heuristic: if the trigger specifically mentions a category that doesn't match the merchant, skip it.
        const triggerStr = String(trigger_id).toLowerCase();
        const categoryStr = String(merchantContext?.payload?.identity?.category || "").toLowerCase();
        
        if (categoryStr && triggerStr.includes('_') && !triggerStr.includes(categoryStr)) {
            // E.g. trigger: "trg_research_digest_dentists", category: "salons" -> skip
            // Note: This is a fast heuristic, so we check if the category word is in the trigger ID.
            if (['dentists', 'salons', 'restaurants', 'gyms', 'pharmacies'].some(cat => triggerStr.includes(cat)) && !triggerStr.includes(categoryStr)) {
                continue;
            }
        }
        
        candidateTasks.push(aiService.composeAction(merchant_id, merchantContext, trigger_id, triggerContext, now));
      }
      if (candidateTasks.length >= 20) break;
    }

    const results = await Promise.all(candidateTasks);
    
    const actions = results.filter(action => action !== null);

    res.status(200).json({ actions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
