require('dotenv').config();
const { google } = require('googleapis');

async function testGoogleSheets() {
    console.log('🔍 Testing Google Sheets connection...');

    try {
        // Check environment variables
        console.log('📋 Environment Variables:');
        console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '✅ SET' : '❌ NOT SET');
        console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ SET' : '❌ NOT SET');
        console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ SET' : '❌ NOT SET');

        if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            console.log('❌ Missing Google Sheets environment variables');
            return;
        }

        // Create JWT client
        console.log('🔐 Setting up Google APIs auth...');
        const auth = new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        // Authorize the client
        console.log('🔑 Authorizing JWT client...');
        await auth.authorize();

        console.log('📊 Initializing Google Sheets API...');
        const sheets = google.sheets({ version: 'v4', auth });

        // Test read operation
        console.log('📖 Testing read operation...');
        const readResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1!A1:G1'
        });
        console.log('✅ Read successful:', readResponse.data.values);

        // Test write operation
        console.log('✏️ Testing write operation...');
        const writeResponse = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Sheet1!A:G',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [['TEST', 'PRODUCTION', new Date().toISOString(), '✅ SUCCESS', '', '']]
            }
        });
        console.log('✅ Write successful:', writeResponse.data);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testGoogleSheets();