class StartCommand {
  constructor(bot) {
    this.bot = bot;
  }

  async execute(ctx) {
    try {
      const userName = ctx.from.first_name + " " + ctx.from.last_name || 'Pengguna';
      const welcomeMessage = `👋 Selamat datang, *${userName}*!\n\n` +
          `Saya adalah *Savani* bot Telegram yang dibuat oleh kekasihmu tercinta, yang siap membantu proses pencatatan dan pelaporan tabungan masa depan *Abid & Nisa*.\n\n` +
          `Perintah yang tersedia:\n` +
          `🔹 /start - Memulai Percakapan\n` +
          `🔹 /help - Menampilkan Bantuan\n` +
          `🔹 /info - Informasi Bot`;

      const keyboard = {
          reply_markup: {
              inline_keyboard: [
                  [
                      {text: "Input Transaksi", callback_data: "input_transaksi"},
                      {text: "Report", callback_data: "report_transaksi"}
                  ]
              ]
          }
      }

      await this.bot.reply(ctx, welcomeMessage, {parse_mode: 'Markdown', ...keyboard});
      this.bot.log(`User ${ctx.from.username || ctx.from.id} started the bot`);
    } catch (error) {
      this.bot.handleError(error, ctx);
    }
  }
}

module.exports = StartCommand;