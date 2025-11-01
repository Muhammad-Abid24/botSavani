const BaseController = require('./BaseController');
const StartCommand = require('../commands/main/startCommand');
const HelpCommand = require('../commands/main/helpCommand');
const InfoCommand = require('../commands/main/infoCommand');
const TransactionCommand = require('../commands/main/transactionCommand');
const MessageHandler = require('../commands/messageHandler');
const UnknownCommand = require('../commands/unknownCommand');
const ReportCommand = require("../commands/main/reportCommand");

class BotController extends BaseController {
  constructor(bot) {
    super(bot);

    // Initialize command handlers
    this.startCommand = new StartCommand(this);
    this.helpCommand = new HelpCommand(this);
    this.infoCommand = new InfoCommand(this);
    this.transactionCommand = new TransactionCommand(this);
    this.reportCommand  = new ReportCommand(this);
    this.messageHandler = new MessageHandler(this);
    this.unknownCommandHandler = new UnknownCommand(this);
  }

  // Handle /start command
  async start(ctx) {
    await this.startCommand.execute(ctx);
  }

  // Handle /help command
  async help(ctx) {
    await this.helpCommand.execute(ctx);
  }

  // Handle /info command
  async info(ctx) {
    await this.infoCommand.execute(ctx);
  }

    async report(ctx) {
        await this.reportCommand.execute(ctx);
    }

  // Handle /transaction command
    async transaction(ctx){
      await this.transactionCommand.execute(ctx);
    }

  // Handle deposit input
  async handleDepositInput(ctx, amount) {
    await this.transactionCommand.handleDepositInput(ctx, amount);
  }

  // Handle bukti input (photo)
async handleBuktiInput(ctx, photo) {
    await this.transactionCommand.handleBuktiInput(ctx, photo);
  }

  // Handle keterangan input
  async handleKeteranganInput(ctx, keterangan) {
    await this.transactionCommand.handleKeteranganInput(ctx, keterangan);
  }

  // Handle regular messages
  async handleMessage(ctx) {
    await this.messageHandler.execute(ctx);
  }

  // Handle unknown commands
  async unknownCommand(ctx) {
    await this.unknownCommandHandler.execute(ctx);
  }
}

module.exports = BotController;