module.exports = {
  token: process.env.BOT_TOKEN,
  options: {
    polling: process.env.NODE_ENV === 'development',
    webhook: process.env.NODE_ENV === 'production' ? {
      domain: process.env.VERCEL_URL,
      path: '/api/webhook'
    } : false
  }
};