CREATE TABLE dm_documents (
    doc_id INT PRIMARY KEY AUTO_INCREMENT,
    doc_kb_id INT NOT NULL,
    doc_original_name VARCHAR(255) NOT NULL,
    doc_stored_name VARCHAR(255) NOT NULL UNIQUE,
    doc_mime_type VARCHAR(100) NOT NULL,
    doc_file_extension VARCHAR(20) NOT NULL,
    doc_size_in_bytes INT NOT NULL,
    doc_path VARCHAR(500) NOT NULL,
    doc_relative_path VARCHAR(500) NULL,          -- NEW: Folder structure
    doc_status ENUM('UPLOADED','INDEXING','INDEXED','FAILED') DEFAULT 'UPLOADED',
    doc_metadata JSON NULL,
    doc_createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    doc_updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doc_kb_id) REFERENCES dm_knowledge_base(kb_id) ON DELETE CASCADE,
    INDEX idx_kb_id (doc_kb_id),
    INDEX idx_status (doc_status),
    INDEX idx_relative_path (doc_relative_path)
);
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci
AUTO_INCREMENT=1;