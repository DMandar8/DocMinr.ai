-- ============================================
-- Migration: 002_create_knowledge_base_table
-- Description: Create knowledge base table
-- ============================================

CREATE TABLE IF NOT EXISTS docminr_db.dm_knowledge_base (
    kb_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    kb_user_id INT NOT NULL,
    kb_name VARCHAR(255) NOT NULL,
    kb_description VARCHAR(255) NOT NULL,
    kb_createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kb_updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kb_user_id) REFERENCES docminr_db.dm_users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (kb_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=1;