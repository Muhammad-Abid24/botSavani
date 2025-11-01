
const { google } = require('googleapis');
const moment = require('moment');

class TransactionCommand {
    constructor(bot) {
        this.bot = bot;
        this.transactionData = new Map(); // Store temporary transaction data
    }

    async execute(ctx) {
        try {
            // Check if user is already authenticated
            const user = ctx.from.id;
            const username = ctx.from.username;

            // if (!user || !username) {
            //     // User needs to authenticate first
            //     const errorMsg = `Kamu Belum Login Telegram!`;
            //     await this.bot.reply(ctx, errorMsg, { parse_mode: 'Markdown' });
            //     return;
            // }

            const userName = ctx.from.first_name + " " + ctx.from.last_name || 'Pengguna';

            // Initialize transaction data for this user
            this.transactionData.set(user, {
                date: moment().format('DD/MM/YYYY'),
                time: moment().format('HH:mm:ss'),
                username: userName,
                deposit: null,
                bukti: null,
                keterangan: ""
            });

            const transMsg = `*${userName}*, Silahkan Kamu masukkan Form Inputan di bawah ini untuk memasukkan transaksi hari ini\n\n` +
                `📅 *Tanggal*: ${this.transactionData.get(user).date}\n` +
                `🕐 *Waktu*: ${this.transactionData.get(user).time}\n` +
                `👤 *Username*: ${this.transactionData.get(user).username}\n\n` +
                `💰 *Deposit*: (Format: Rp. 50.000) - WAJIB DIISI\n` +
                `📎 *Bukti*: Upload foto (.jpg/.png) - WAJIB DIISI\n` +
                `📝 *Keterangan*: Opsional\n\n` +
                `Silakan masukkan jumlah deposit terlebih dahulu!`;

            await this.bot.reply(ctx, transMsg, { parse_mode: 'Markdown' });

            // Set user transaction state to wait for deposit input
            console.log(`DEBUG: Setting user ${user} to waiting_deposit state`);
            this.bot.messageHandler.setUserTransactionState(user, 'waiting_deposit');
        } catch (error) {
            this.bot.handleError(error, ctx);
        }
    }

    async handleDepositInput(ctx, amount) {
        const user = ctx.from.id;
        console.log(`DEBUG: handleDepositInput called for user ${user} with amount: ${amount}`);

        const data = this.transactionData.get(user);
        console.log(`DEBUG: Transaction data for user ${user}:`, data);

        if (!data) {
            console.log(`DEBUG: No transaction data found for user ${user}`);
            await this.bot.reply(ctx, '⚠️ Sesi transaksi tidak ditemukan. Silakan mulai kembali dengan /input_transaksi', { parse_mode: 'Markdown' });
            return;
        }

        // Validate Indonesian Rupiah format
        const amountRegex = /^Rp\.\s*\d{1,3}(?:\.\d{3})*$/;
        if (!amountRegex.test(amount)) {
            await this.bot.reply(ctx, '❌ Format deposit salah! Gunakan format: Rp. 50.000', { parse_mode: 'Markdown' });
            return;
        }

        data.deposit = amount;
        this.transactionData.set(user, data);

        await this.bot.reply(ctx, `✅ Deposit berhasil disimpan: ${amount}\n\n📎 Sekarang silakan upload bukti transfer (foto .jpg/.png):`, { parse_mode: 'Markdown' });
    }

    async handleBuktiInput(ctx, media) {
        const user = ctx.from.id;
        const data = this.transactionData.get(user);
        console.log(`DEBUG: handleBuktiInput called for user ${user}`);

        if (!data) {
            console.log(`DEBUG: No transaction data found for user ${user}`);
            await this.bot.reply(ctx, '⚠️ Sesi transaksi tidak ditemukan. Silakan mulai kembali dengan /input_transaksi', { parse_mode: 'Markdown' });
            return;
        }

        console.log(`DEBUG: Media object:`, media);

        // Handle both photo and document
        let fileDisplayName = '';
        if (media.file_name) {
            // Document with file name
            fileDisplayName = media.file_name;
            console.log(`DEBUG: Document file_name:`, media.file_name);
        } else if (media.file_id) {
            // Photo (no file name)
            fileDisplayName = media.file_id;
            console.log(`DEBUG: Photo file_id:`, media.file_id);
        }

        // Generate file URL for bukti using Telegraf
        let fileUrl = '';
        console.log(`DEBUG: File ID:`, media.file_id);

        try {
            // Use Telegraf's built-in getFile method
            const fileInfo = await ctx.telegram.getFile(media.file_id);
            console.log(`DEBUG: File info from Telegraf:`, fileInfo);

            if (fileInfo && fileInfo.file_path) {
                // Generate direct file URL using file_path
                // Get bot token from multiple sources
                let botToken = this.bot.token || ctx.telegram.token;

                // Try to get token from environment
                if (!botToken) {
                    botToken = process.env.TELEGRAM_BOT_TOKEN;
                    console.log(`DEBUG: Bot token from environment:`, botToken ? 'YES' : 'NO');
                }

                console.log(`DEBUG: Bot token available:`, botToken ? 'YES' : 'NO');

                if (botToken) {
                    fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.file_path}`;
                    console.log(`DEBUG: ✓ Generated file URL:`, fileUrl);
                    console.log(`DEBUG: File path:`, fileInfo.file_path);
                } else {
                    console.log(`DEBUG: ✗ Bot token not found in instance`);
                }
            } else {
                console.log(`DEBUG: ✗ No file_path in file info`);
            }
        } catch (error) {
            console.log(`DEBUG: ✗ Error getting file URL via Telegraf:`, error.message);
        }

        // Final result
        if (!fileUrl) {
            console.log(`DEBUG: ⚠️ Could not generate file URL, using file_id as fallback`);
            console.log(`DEBUG: File ID fallback:`, media.file_id);
        }

        data.bukti = fileUrl || media.file_id; // Save URL or fallback to file_id
        this.transactionData.set(user, data);

        console.log(`DEBUG: Bukti saved, updating transaction state to waiting_keterangan`);
        this.bot.messageHandler.setUserTransactionState(user, 'waiting_keterangan');

        await this.bot.reply(ctx, `✅ Bukti berhasil disimpan: ${fileDisplayName}\n\n📝 Masukkan keterangan (opsional) atau ketik "skip" untuk tidak mengisi:`, { parse_mode: 'Markdown' });
    }

    async handleKeteranganInput(ctx, keterangan) {
        const user = ctx.from.id;
        const data = this.transactionData.get(user);

        if (!data) {
            await this.bot.reply(ctx, '⚠️ Sesi transaksi tidak ditemukan. Silakan mulai kembali dengan /input_transaksi', { parse_mode: 'Markdown' });
            return;
        }

        if (keterangan.toLowerCase() !== 'skip') {
            data.keterangan = keterangan;
        } else {
            data.keterangan = "-";
        }

        this.transactionData.set(user, data);

        await this.bot.reply(ctx, '✅ Semua data telah lengkap.\n' +
            '🔄 Sedang menyimpan ke Google Spreadsheet...', { parse_mode: 'Markdown' });
        await this.saveToGoogleSheet(ctx, user);
    }

    async saveToGoogleSheet(ctx, user) {
        try {
            const data = this.transactionData.get(user);
            console.log('DEBUG: Attempting to save to Google Sheets:', data);

            // Check environment variables
            console.log('DEBUG: GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? 'SET' : 'NOT SET');
            console.log('DEBUG: GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET');
            console.log('DEBUG: GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'SET' : 'NOT SET');

            if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
                console.log('DEBUG: Missing Google Sheets environment variables');
                await this.bot.reply(ctx, '❌ Google Sheets credentials not configured. Please check environment variables.', { parse_mode: 'Markdown' });
                return;
            }

            // Create JWT client using Google APIs
            console.log('DEBUG: Setting up Google APIs auth...');
            let privateKey = process.env.GOOGLE_PRIVATE_KEY;

            // Handle different private key formats
            if (privateKey.includes('"')) {
                // JSON format - extract the actual key
                const keyMatch = privateKey.match(/"private_key":\s*"([^"]+)"/);
                if (keyMatch) {
                    privateKey = keyMatch[1].replace(/\\n/g, '\n');
                }
            } else {
                // Already in correct format, just handle escaped newlines
                privateKey = privateKey.replace(/\\n/g, '\n');
            }

            console.log('DEBUG: Processed private key length:', privateKey.length);

            const auth = new google.auth.JWT({
                email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                key: privateKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            // Authorize the client
            console.log('DEBUG: Authorizing JWT client...');
            await auth.authorize();

            console.log('DEBUG: Initializing Google Sheets API...');
            const sheets = google.sheets({ version: 'v4', auth });

            // Prepare the data to append with hyperlink for bukti
            const buktiValue = data.bukti.startsWith('http')
                //? `=HYPERLINK("${data.bukti}", "Lihat Bukti")`
                ? `${data.bukti}`
                : data.bukti;

            const rowData = [
                data.date,
                data.time,
                data.username,
                data.deposit,
                buktiValue,
                data.keterangan
            ];
            console.log('DEBUG: Row data to append:', rowData);

            // Append the row to the spreadsheet
            console.log('DEBUG: Appending row to Google Sheets...');
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'Sheet1!A:F', // Columns A through F
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [rowData]
                }
            });

            console.log('DEBUG: Row added successfully!', response.data);

            // Clear transaction data
            this.transactionData.delete(user);

            await this.bot.reply(ctx, '🎉 Transaksi berhasil disimpan ke Google Spreadsheet!\n\nTerima kasih telah menggunakan *Savani* bot.', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🔙 Kembali ke Menu", callback_data: "back_to_start" }
                    ]]
                }
            });

        } catch (error) {
            console.error('Error saving to Google Sheets:', error);
            await this.bot.reply(ctx, '❌ Terjadi kesalahan saat menyimpan ke Google Spreadsheet. Silakan coba lagi nanti.', { parse_mode: 'Markdown' });
        }
    }
}

module.exports = TransactionCommand;