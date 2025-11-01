const { Telegraf } = require('telegraf');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Import bot configuration and routes
const BotRoutes = require('../src/routes/botRoutes');
const { userSession } = require('../src/views/middleware/userSession');
const logger = require('../src/views/middleware/logger');

// Setup middleware
bot.use(logger);
bot.use(userSession);

// Setup routes
const routes = new BotRoutes(bot);

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi nanti.');
});

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    // Only handle POST requests for Telegram webhook
    if (req.method === 'POST') {
      console.log('Received webhook update:', JSON.stringify(req.body, null, 2));

      // Process the update
      await bot.handleUpdate(req.body);

      console.log('Webhook processed successfully');
      return res.status(200).send('OK');
    }

    // Handle GET requests for health check
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'Bot is running',
        timestamp: new Date().toISOString()
      });
    }

    // Handle OPTIONS for CORS
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(200).end();
    }

    // Handle other methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};