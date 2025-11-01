class InfoCommand {
  constructor(bot) {
    this.bot = bot;
  }

  async execute(ctx) {
    try {
      const infoMessage = `📊 *Informasi Bot*\n\n` +
      `🤖 Nama Bot: ${ctx.botInfo.first_name}\n` +
      `🆔 Username Bot: @${ctx.botInfo.username}\n` +
      `📅 Dibuat: 21/10/2025\n\n` +
          `🪪 *Informasi User*\n` +
      `👥 Username User: ${ctx.from.first_name} ${ctx.from.last_name}\n` +
      `🆔 Telegram ID: ${ctx.chat.id}\n\n` +
      `Made With ❤️`;

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔙 Kembali", callback_data: "back_to_start" }
            ]
          ]
        }
      };

      await this.bot.reply(ctx, infoMessage, { parse_mode: 'Markdown', ...keyboard });
    } catch (error) {
      this.bot.handleError(error, ctx);
    }
  }
}

module.exports = InfoCommand;