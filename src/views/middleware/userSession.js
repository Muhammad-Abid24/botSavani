const User = require('../../models/User');

// Simple in-memory user storage (for production, use a proper database)
const userStore = new Map();

const userSession = (ctx, next) => {
  const userId = ctx.from.id;

  // Get or create user
  let user = userStore.get(userId);
  if (!user) {
    user = new User(ctx.from);
    userStore.set(userId, user);
    console.log(`New user registered: ${user.getDisplayName()} (@${user.username || 'N/A'})`);
  }

  // Update user activity
  user.updateActivity();

  // Add user to context for controllers to use
  ctx.user = user;

  return next();
};

// Helper function to get user statistics
const getUserStats = () => {
  const totalUsers = userStore.size;
  const activeUsers = Array.from(userStore.values()).filter(user => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return user.lastSeen > fiveMinutesAgo;
  }).length;

  return {
    totalUsers,
    activeUsers,
    users: Array.from(userStore.values()).map(user => user.toJSON())
  };
};

module.exports = {
  userSession,
  getUserStats
};