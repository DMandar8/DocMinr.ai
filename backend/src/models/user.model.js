/**
 * User Model
 * Defines the user schema and provides helper methods
 * Note: This is a model definition, actual DB operations are in user.service.js
 */
class UserModel {
  /**
   * Map database column names to camelCase for application use
   */
  static fromDatabase(row) {
    if (!row) return null;
    
    return {
      userId: row.user_id,
      firstName: row.user_fname,
      lastName: row.user_lname,
      email: row.user_email,
      password: row.user_pass, // Hashed password
      createdAt: row.user_createdAt,
      updatedAt: row.user_updatedAt,
    };
  }

  /**
   * Map application object to database columns
   * Useful for INSERT/UPDATE operations
   */
  static toDatabase(user) {
    const dbObj = {};
    
    if (user.firstName !== undefined) dbObj.user_fname = user.firstName;
    if (user.lastName !== undefined) dbObj.user_lname = user.lastName;
    if (user.email !== undefined) dbObj.user_email = user.email;
    if (user.password !== undefined) dbObj.user_pass = user.password;
    if (user.createdAt !== undefined) dbObj.user_createdAt = user.createdAt;
    if (user.updatedAt !== undefined) dbObj.user_updatedAt = user.updatedAt;
    
    return dbObj;
  }

  /**
   * Get user schema definition (for reference)
   */
  static getSchema() {
    return {
      tableName: 'dm_users',
      columns: {
        userId: 'user_id',
        firstName: 'user_fname',
        lastName: 'user_lname',
        email: 'user_email',
        password: 'user_pass',
        createdAt: 'user_createdAt',
        updatedAt: 'user_updatedAt',
      },
    };
  }

  /**
   * Get full name
   */
  static getFullName(user) {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim();
  }

  /**
   * Sanitize user object (remove sensitive data)
   */
  static sanitize(user) {
    if (!user) return null;
    
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = UserModel;