class ReportCommand {
    constructor(bot) {
        this.bot = bot;
    }

    async execute(ctx) {
        try {
            const message = `Anda bisa melihat *Report Transaksi* pada link di bawah ini\n\n` +
                process.env.LINK_SHEET
            ;

            await this.bot.reply(ctx, message, { parse_mode: 'Markdown'});
        } catch (error) {
            this.bot.handleError(error, ctx);
        }
    }
}

module.exports = ReportCommand;