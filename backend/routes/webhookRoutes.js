const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/webhookController');

const WEBHOOK_SECRET = process.env.DIALOGFLOW_WEBHOOK_SECRET;

router.post('/webhook', (req, res, next) => {
  if (!WEBHOOK_SECRET) {
    console.error('DIALOGFLOW_WEBHOOK_SECRET is not set — refusing all webhook calls');
    return res.status(500).json({ error: 'Webhook not configured' });
  }
  if (req.query.key !== WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}, handleWebhook);

module.exports = router;