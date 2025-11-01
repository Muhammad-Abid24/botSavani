require('dotenv').config();
const { Telegraf } = require('telegraf');
const botConfig = require('./src/config/bot');
const BotRoutes = require('./src/routes/botRoutes');
const { userSession } = require('./src/views/middleware/userSession');
const logger = require('./src/views/middleware/logger');

// Check bot token
if (!botConfig.token) {
    console.log('❌ Bot token not found!');
    console.log('💡 Please set BOT_TOKEN in .env file or as environment variable');
    console.log('📝 Example: BOT_TOKEN=your_bot_token_here');
    process.exit(1);
}

// Initialize bot
const bot = new Telegraf(botConfig.token, botConfig.options);

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

// For development mode with polling
if (process.env.NODE_ENV !== 'production') {
    // Launch bot
    bot.launch(() => {
        console.log('🤖 Bot started successfully!');
        console.log(`📡 Bot username: @${bot.botInfo?.username || 'Unknown'}`);
        console.log('🔥 Hot reload is active - bot will restart on file changes');
    });

    // Enable graceful stop
    process.once('SIGINT', () => {
        console.log('🛑 Shutting down bot...');
        bot.stop('SIGINT');
    });

    process.once('SIGTERM', () => {
        console.log('🛑 Shutting down bot...');
        bot.stop('SIGTERM');
    });
}

// Export bot for Vercel
module.exports = bot;