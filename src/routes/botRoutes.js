const BotController = require('../controllers/BotController');

class BotRoutes {
  constructor(bot) {
    this.controller = new BotController(bot);
    this.setupRoutes(bot);
  }

  setupRoutes(bot) {
    console.log('DEBUG: Setting up bot routes...');

    // Command routes
    bot.start((ctx) => this.controller.start(ctx));
    bot.help((ctx) => this.controller.help(ctx));
    bot.command('info', (ctx) => this.controller.info(ctx));
    bot.command('input', (ctx) => this.controller.transaction(ctx));
    bot.command('input_transaksi', (ctx) => this.controller.transaction(ctx));

    // Handle ALL message types for debugging
    bot.on('message', async (ctx) => {
      console.log('DEBUG: Message received, type:', Object.keys(ctx.message));
      console.log('DEBUG: Message object keys:', Object.keys(ctx.message));

      // Check message types
      if (ctx.message.text) {
        console.log('DEBUG: Text message received:', ctx.message.text);
        console.log('DEBUG: Current transaction states:', Array.from(this.controller.messageHandler.userTransactionState.entries()));

        // Check if it's a command
        if (ctx.message.text.startsWith('/')) {
          this.controller.unknownCommand(ctx);
          return;
        }

        // Otherwise, handle as regular message
        this.controller.handleMessage(ctx);
        return;
      }

      if (ctx.message.photo) {
        console.log('DEBUG: Photo received from user:', ctx.from.id);
        const userId = ctx.from.id;
        const state = this.controller.messageHandler.userTransactionState.get(userId);
        console.log('DEBUG: User state when photo received:', state);

        if (state === 'waiting_bukti') {
          console.log('DEBUG: User is in waiting_bukti state, processing photo...');
          // Get the highest resolution photo
          const photo = ctx.message.photo[ctx.message.photo.length - 1];
          await this.controller.handleBuktiInput(ctx, photo);
          // State is now updated inside handleBuktiInput
        } else {
          await this.controller.reply(ctx, '📎 Terima kasih untuk fotonya! Upload foto bukti hanya bisa dilakukan saat proses transaksi.');
        }
        return;
      }

      if (ctx.message.document) {
        console.log('DEBUG: Document received from user:', ctx.from.id);
        console.log('DEBUG: Document info:', ctx.message.document);
        const userId = ctx.from.id;
        const state = this.controller.messageHandler.userTransactionState.get(userId);
        console.log('DEBUG: User state when document received:', state);

        if (state === 'waiting_bukti') {
          console.log('DEBUG: User is in waiting_bukti state, processing document...');
          const document = ctx.message.document;

          // Check if document is a photo (JPG, JPEG, PNG)
          if (document.mime_type && (
            document.mime_type.startsWith('image/') ||
            document.file_name.toLowerCase().endsWith('.jpg') ||
            document.file_name.toLowerCase().endsWith('.jpeg') ||
            document.file_name.toLowerCase().endsWith('.png')
          )) {
            console.log('DEBUG: Document is an image, processing as bukti...');
            await this.controller.handleBuktiInput(ctx, document);
          } else {
            await this.controller.reply(ctx, '❌ Document bukan gambar! Silakan upload foto dengan format .jpg/.jpeg/.png.', { parse_mode: 'Markdown' });
          }
        } else {
          await this.controller.reply(ctx, '📎 Terima kasih untuk dokumennya! Upload bukti hanya bisa dilakukan saat proses transaksi.');
        }
        return;
      }

      // Handle other message types
      await this.controller.reply(ctx, '📎 Terima kasih untuk file Anda! Saat ini saya hanya bisa menangani pesan teks dan foto untuk bukti transaksi.');
    });

    // Handle callback queries
    bot.action('back_to_start', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
      await this.controller.start(ctx);
    });

    bot.action('input_transaksi', async (ctx) => {
      await ctx.answerCbQuery();
      //await ctx.deleteMessage().catch(() => {});
      // TODO: Add transaction input logic here
      await this.controller.transaction(ctx);
    });

    bot.action('report_transaksi', async (ctx) => {
        await ctx.answerCbQuery();
        //await ctx.deleteMessage().catch(() => {});
        await this.controller.report(ctx);
    })

    console.log('✅ Bot routes registered successfully');
  }
}

module.exports = BotRoutes;