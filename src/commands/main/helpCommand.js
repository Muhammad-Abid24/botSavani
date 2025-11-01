class HelpCommand {
  constructor(bot) {
    this.bot = bot;
  }

  async execute(ctx) {
    try {
      const helpMessage = `🤖 *Bantuan Bot*\n\n` +
            `Berikut adalah perintah yang tersedia:\n\n` +
            `🔹 /start - Memulai Percakapan\n` +
            `🔹 /help - Menampilkan Bantuan\n` +
            `🔹 /info - Informasi Bot`;

        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔙 Kembali", callback_data: "back_to_start" }
                    ]
                ]
            }
        };

      await this.bot.reply(ctx, helpMessage, { parse_mode: 'Markdown', ...keyboard});
    } catch (error) {
      this.bot.handleError(error, ctx);
    }
  }
}

module.exports = HelpCommand;