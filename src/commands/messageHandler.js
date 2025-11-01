class MessageHandler {
  constructor(bot) {
    this.bot = bot;
    this.userTransactionState = new Map(); // Track user transaction progress
  }

  async execute(ctx) {
    try {
      const messageText = ctx.message.text;
      const userName = ctx.from.first_name || 'Pengguna';
      const userId = ctx.from.id;

      console.log(`DEBUG: Received message from ${userId}: ${messageText}`);
      console.log(`DEBUG: Current transaction states:`, Array.from(this.userTransactionState.entries()));

      // Check if user is in transaction process
      if (this.userTransactionState.has(userId)) {
        const state = this.userTransactionState.get(userId);
        console.log(`DEBUG: User ${userId} is in state: ${state}, message: ${messageText}`);

        if (state === 'waiting_deposit') {
          // Access the transaction command through the bot controller
          console.log('DEBUG: Calling handleDepositInput...');
          await this.bot.transactionCommand.handleDepositInput(ctx, messageText);
          this.userTransactionState.set(userId, 'waiting_bukti');
          return;
        }

        if (state === 'waiting_keterangan') {
          await this.bot.transactionCommand.handleKeteranganInput(ctx, messageText);
          this.userTransactionState.delete(userId); // Clear state after completion
          return;
        }
      }

      // Log the message
      this.bot.log(`Message from ${userName} (@${ctx.from.username || 'N/A'}): ${messageText}`);

      // Simple response
      const responses = [
        `👋 Hai ${userName}! Pesan Anda diterima: "${messageText}"`,
        `💬 Terima kasih ${userName}! Anda mengatakan: "${messageText}"`,
        `📝 Pesan diterima: "${messageText}"\n\nKetik /help untuk melihat perintah yang tersedia.`
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      await this.bot.reply(ctx, randomResponse);
    } catch (error) {
      this.bot.handleError(error, ctx);
    }
  }

  setUserTransactionState(userId, state) {
    this.userTransactionState.set(userId, state);
  }

  clearUserTransactionState(userId) {
    this.userTransactionState.delete(userId);
  }
}

module.exports = MessageHandler;