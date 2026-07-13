-- ============================================
-- Migration: 001_create_users_table
-- Description: Create users table
-- ============================================

CREATE TABLE IF NOT EXISTS docminr_db.dm_users (
    user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_fname VARCHAR(255) NOT NULL,
    user_lname VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_pass VARCHAR(500) NOT NULL,
    user_createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=1;

