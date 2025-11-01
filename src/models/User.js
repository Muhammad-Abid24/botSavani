class User {
  constructor(userData) {
    this.id = userData.id;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.username = userData.username;
    this.languageCode = userData.language_code || 'en';
    this.isBot = userData.is_bot || false;
    this.createdAt = new Date();
    this.lastSeen = new Date();
    this.messageCount = 0;
  }

  // Update user activity
  updateActivity() {
    this.lastSeen = new Date();
    this.messageCount++;
  }

  // Get user display name
  getDisplayName() {
    return this.firstName + (this.lastName ? ` ${this.lastName}` : '');
  }

  // Get user mention
  getMention() {
    if (this.username) {
      return `@${this.username}`;
    }
    return `[${this.getDisplayName()}](tg://user?id=${this.id})`;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      languageCode: this.languageCode,
      isBot: this.isBot,
      createdAt: this.createdAt,
      lastSeen: this.lastSeen,
      messageCount: this.messageCount
    };
  }

  // Create from database record
  static fromDB(data) {
    const user = new User(data);
    user.createdAt = new Date(data.created_at);
    user.lastSeen = new Date(data.last_seen);
    return user;
  }
}

module.exports = User;