class UnknownCommand {
  constructor(bot) {
    this.bot = bot;
  }

  async execute(ctx) {
    try {
      await this.bot.reply(ctx, '❓ Perintah tidak dikenal.\n\nKetik /help untuk melihat perintah yang tersedia.');
    } catch (error) {
      this.bot.handleError(error, ctx);
    }
  }
}

module.exports = UnknownCommand;