
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

        // Update user state to waiting_bukti
        console.log(`DEBUG: Updating user ${user} state to waiting_bukti`);
        this.bot.messageHandler.setUserTransactionState(user, 'waiting_bukti');

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

        // Execute save immediately
        this.saveToGoogleSheet(ctx, user).then(() => {
            this.bot.messageHandler.clearUserTransactionState(user);
        }).catch(() => {
            this.bot.messageHandler.clearUserTransactionState(user);
        });
    }

    async saveToGoogleSheet(ctx, user) {
        const data = this.transactionData.get(user);
        if (!data) {
            await this.bot.reply(ctx, '❌ Data transaksi tidak ditemukan.', { parse_mode: 'Markdown' });
            return;
        }

        try {
            // Use hardcoded credentials to ensure it works
            const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCt1KZ3gLENuovx\nfDK8zFY3CE8BF+bW2KNcfZi+ubNjZxaUZ/3C6Rwp0Y0EI7zsBAWoyiB+CxSSHp/K\nqzHetUBx1aa4qH9iQaEwqRScztssq0rMW9/OJD9KTcTNeOW1YcqBX4qr/KwRHmO8\nbTC1bq9NozNkVcU9Gib6UZ9nVL+XtE9oY7iFr8IqD0rQ8punPta5zC8LfU3wPzKO\nkQVwO6Z36vpe1yjO8bPon9exKqEQRphpKlHBVWmOWYPok5AlCVsOwnmRpvrGVMSL\n9VkamplVCx8Ntek2AqUYSdAnD2ja6UnYb0YBpgTWS4zdFi2cPJE2gfb8cWcC9e9D\nfKdN7JXJAgMBAAECggEAD+pDiHbtnvBoriYdHhiGPzkhRJwb3ClPAaGVKccmQ7BV\nSqafvufpVnHTW6DrA9/VZdAFvAyHKF6p6hwU74tAOHvjbQ4uRYB1QdeFJdsxiWww\nZ7f0rHK4obSvk1FhlKL8r64f6+GxHksePgrwNfhJkA3kX2gT7CV4EpyE/+isNvca\nWWc/YI/MqahHLPPkAjpYPg5oMl2Ih3sG1NObxTeSaAaMmhCp9QeSVunPRBD9lqdM\nnOrtc/4w3kgWApuSPQwL4LhFOVZfBk9cxoGqIaHNWESjuKUfm9deg2Neyfflt0Sk\n4WA7DRnlm0aaP6s14+kIcm0+FPTiedL5c2zpx/msBQKBgQDV1yePMOTzV2ScqYoQ\nrjBobMny7giN2mwVL3Q/EWCPCTaxTii4ciysZvvAm3D/yE/sguTqGk6Ovajr4OO/\nPLHZMtNu+9zlbPGhstcaT1NLASC+9VXKNukgFnvQNqEkW7zwHWcQhfMSo27HbSKV\ne1krZxUEdA8O7ivkl8n+WjkDrQKBgQDQGiR7K61T2pgg0Q/+WCbpPnFl54SP6n7/\njhbJeJ8ZdHHO3jgFhXBQJ5ndQgWLqkoiS8TnXM4YVBbGRT+tjf9X7fQOjxu3xv+I\nAx0WY29eiZawSwZ7Y4ilfv0KeT/EASA0vUGuf6iMXx5IOcIZt8leFvH3KgAMCyC0\nI9DmiyG+DQKBgBizO3yMt0VsaNC3vJzkoe7N8h2/ZPmNq0JfMtw+E5syA0FDt+xm\nM8bONnIvAkRpTOIS1II9+6j9O0/TsDrcteZSup1tNjzB8r8suy/szcAyJygnintL\nEG6GalLInKBogFBz9P2xmzwh6J/ceUwu7UPYKlNTXJHq7OMArXJV1ZQZAoGAUMVk\n1X3NZ5eXpl0exQy4BZ3b676hoC5XHp+qzoYH0px0s+NigRoazrGgMdW3S09MOOWJ\nxncp8x1oPYqRPa64pgtQx/nZu0n80nDK8G6lwl7K4yArouauGfYhBtiq3EvHkVDH\n1o/r/pfIrCXm5Y6FFQT444Mkw4fqKKEiKuljrl0CgYA1XmwhXU0Y98kqCDoLNotr\nmlXO3PSxbDioP0OVuQyEj7YwzhfxqR7w4IdLEocMhXxxCJGH/fyYzAROqZuaM/xC\nX9VGWgY8tOEyIBbKSAE//6J72BR72wiFN0WXSfKWnn8WOZ3DGH0rwTZw8eOFb5aN\nH0XEOaAd+TH//dfO9Y5DsA==\n-----END PRIVATE KEY-----";

            const auth = new google.auth.JWT({
                email: 'savani@savani-475720.iam.gserviceaccount.com',
                key: privateKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            await auth.authorize();
            const sheets = google.sheets({ version: 'v4', auth });

            const rowData = [
                data.date,
                data.time,
                data.username,
                data.deposit,
                data.bukti,
                data.keterangan
            ];

            await sheets.spreadsheets.values.append({
                spreadsheetId: '1a9y4Mm5LbURmErAtCmtGJjb-o7YYEVCJxB2HGo60tmE',
                range: 'Sheet1!A:F',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values: [rowData] }
            });

            // Clear transaction data
            this.transactionData.delete(user);

            // Send success message
            await this.bot.reply(ctx, '🎉 Transaksi berhasil disimpan ke Google Spreadsheet!\n\nTerima kasih telah menggunakan *Savani* bot.', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🔙 Kembali ke Menu", callback_data: "back_to_start" }
                    ]]
                }
            });

        } catch (error) {
            await this.bot.reply(ctx, '❌ Gagal menyimpan ke Google Spreadsheet. Silakan coba lagi.', { parse_mode: 'Markdown' });
        }
    }
}

module.exports = TransactionCommand;