-- Phase 2: Company profile completion plus primary/sub-group masters.

CREATE TABLE IF NOT EXISTS primary_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sub_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sub_group_name VARCHAR(100) NOT NULL,
    primary_group_id INT NOT NULL,
    chapter_heading_no VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_group_id) REFERENCES primary_groups(id) ON DELETE CASCADE,
    UNIQUE KEY uq_sub_group_per_primary (primary_group_id, sub_group_name),
    INDEX idx_sub_group_primary (primary_group_id)
) ENGINE=InnoDB;

