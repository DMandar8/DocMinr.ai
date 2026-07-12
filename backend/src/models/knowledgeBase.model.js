/**
 * Knowledge Base Model
 * Maps database columns to application fields
 */
class KnowledgeBaseModel {
  /**
   * Map database row to application object
   */
  static fromDatabase(row) {
    if (!row) return null;

    return {
      kbId: row.kb_id,
      userId: row.kb_user_id,
      name: row.kb_name,
      description: row.kb_description,
      createdAt: row.kb_createdAt,
      updatedAt: row.kb_updatedAt,
    };
  }

  /**
   * Map application object to database columns
   */
  static toDatabase(kb) {
    const dbObj = {};

    if (kb.userId !== undefined) dbObj.kb_user_id = kb.userId;
    if (kb.name !== undefined) dbObj.kb_name = kb.name;
    if (kb.description !== undefined) dbObj.kb_description = kb.description;
    if (kb.createdAt !== undefined) dbObj.kb_createdAt = kb.createdAt;
    if (kb.updatedAt !== undefined) dbObj.kb_updatedAt = kb.updatedAt;

    return dbObj;
  }

  /**
   * Get schema definition
   */
  static getSchema() {
    return {
      tableName: 'dm_knowledge_base',
      columns: {
        kbId: 'kb_id',
        userId: 'kb_user_id',
        name: 'kb_name',
        description: 'kb_description',
        createdAt: 'kb_createdAt',
        updatedAt: 'kb_updatedAt',
      },
    };
  }

  /**
   * Sanitize knowledge base object (remove sensitive/irrelevant data)
   */
  static sanitize(kb) {
    if (!kb) return null;

    // For now, just return as-is since there's no sensitive data
    // But we keep this pattern consistent with UserModel
    return { ...kb };
  }
}

module.exports = KnowledgeBaseModel;