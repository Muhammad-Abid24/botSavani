const logger = (ctx, next) => {
  const timestamp = new Date().toISOString();
  const user = ctx.from;
  const message = ctx.message?.text || ctx.updateType;

  console.log(`[${timestamp}] ${user.first_name} (@${user.username || 'N/A'}) [${user.id}]: ${message}`);

  // Call next middleware
  return next();
};

module.exports = logger;