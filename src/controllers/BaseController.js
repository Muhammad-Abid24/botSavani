class BaseController {
  constructor(bot) {
    this.bot = bot;
  }

  // Helper method to send messages
  async sendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.telegram.sendMessage(chatId, text, options);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Helper method to reply to messages
  async reply(ctx, text, options = {}) {
    try {
      return await ctx.reply(text, options);
    } catch (error) {
      console.error('Error replying:', error);
      throw error;
    }
  }

  // Helper method for logging
  log(message, level = 'info') {
    console.log(`[${level.toUpperCase()}] ${new Date().toISOString()}: ${message}`);
  }

  // Error handler
  handleError(error, ctx) {
    this.log(`Error: ${error.message}`, 'error');
    if (ctx) {
      this.reply(ctx, '❌ Terjadi kesalahan. Silakan coba lagi.');
    }
  }
}

module.exports = BaseController;