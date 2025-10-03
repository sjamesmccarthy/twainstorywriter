-- Twain Story Builder Database Schema - MySQL Basic Version
-- Created: October 3, 2025
-- This schema mirrors the localStorage structure for easier migration
-- Basic version without complex triggers, stored procedures, or views
-- Converted from PostgreSQL to MySQL

-- Set SQL mode to strict for better data integrity
SET SQL_MODE = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Drop existing tables if they exist (in correct order to handle foreign keys)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS recent_activities;
DROP TABLE IF EXISTS part_chapters;
DROP TABLE IF EXISTS part_stories;
DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS note_cards;
DROP TABLE IF EXISTS outlines;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS stories;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS ideas;
DROP TABLE IF EXISTS quick_stories;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS global_settings;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- Create Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image TEXT,
    provider VARCHAR(50) DEFAULT 'google',
    provider_id VARCHAR(255),
    account_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_count INT DEFAULT 1,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create User Preferences table (matches localStorage UserPreferences interface)
CREATE TABLE user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Plan and subscription info
    plan_type ENUM('freelance', 'professional') DEFAULT 'freelance',
    plan_status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    plan_start_date TIMESTAMP NULL,
    plan_end_date TIMESTAMP NULL,
    plan_features JSON DEFAULT (JSON_ARRAY('local-storage', 'basic-writing', 'export-txt', 'up-to-1-book')),
    
    -- Account metadata (from localStorage)
    account_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_count INT DEFAULT 1,
    
    -- User interface preferences
    theme ENUM('light', 'dark', 'auto') DEFAULT 'auto',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    default_view ENUM('bookshelf', 'write', 'manage') DEFAULT 'bookshelf',
    
    -- Writing preferences
    auto_save BOOLEAN DEFAULT TRUE,
    auto_save_interval INT DEFAULT 30,
    word_count_goal INT,
    preferred_font_size INT DEFAULT 14,
    preferred_font_family VARCHAR(255) DEFAULT '''Rubik'', sans-serif',
    
    -- Notification preferences
    show_notifications BOOLEAN DEFAULT TRUE,
    show_word_count_notifications BOOLEAN DEFAULT TRUE,
    show_save_notifications BOOLEAN DEFAULT TRUE,
    
    -- Export preferences
    default_export_format ENUM('pdf', 'docx', 'txt', 'html') DEFAULT 'pdf',
    include_metadata_in_export BOOLEAN DEFAULT TRUE,
    
    -- Privacy and data preferences
    analytics_opt_in BOOLEAN DEFAULT FALSE,
    share_usage_data BOOLEAN DEFAULT FALSE,
    
    -- Feature flags and beta access
    beta_features JSON DEFAULT (JSON_ARRAY()),
    experimental_features JSON DEFAULT (JSON_ARRAY()),
    
    -- Recent activity tracking (array of IDs from localStorage)
    recent_books JSON DEFAULT (JSON_ARRAY()),
    recent_stories JSON DEFAULT (JSON_ARRAY()),
    
    -- Custom settings
    custom_settings JSON DEFAULT (JSON_OBJECT()),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Books table (matches localStorage Book interface)
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    author VARCHAR(255) NOT NULL,
    edition VARCHAR(100) DEFAULT 'First Edition',
    copyright_year VARCHAR(4) NOT NULL,
    word_count INT DEFAULT 0,
    target_word_count INT DEFAULT 0,
    cover_image LONGTEXT, -- base64 encoded image data
    
    -- Series information
    is_series BOOLEAN DEFAULT FALSE,
    series_name VARCHAR(255),
    series_number INT,
    
    -- Metadata
    description TEXT,
    genre VARCHAR(100),
    age_group ENUM('Adult', 'Teen', 'Child') DEFAULT 'Adult',
    publisher_name VARCHAR(255),
    
    -- ISBN numbers
    isbn_epub VARCHAR(17),
    isbn_kindle VARCHAR(17),
    isbn_paperback VARCHAR(17),
    isbn_hardcover VARCHAR(17),
    isbn_pdf VARCHAR(17),
    
    -- Legal clauses
    clause_all_rights_reserved BOOLEAN DEFAULT FALSE,
    clause_fiction BOOLEAN DEFAULT FALSE,
    clause_moral_rights BOOLEAN DEFAULT FALSE,
    clause_custom BOOLEAN DEFAULT FALSE,
    custom_clause_text TEXT,
    
    -- Contributors (matches localStorage structure)
    contributors JSON DEFAULT (JSON_ARRAY()),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Quick Stories table (separate from books, matches localStorage)
CREATE TABLE quick_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    description TEXT,
    word_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Global Settings table (for settings like aboutAuthor that are stored globally)
CREATE TABLE global_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, setting_key),
    INDEX idx_user_id (user_id),
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Ideas table (supports both books and quick stories)
CREATE TABLE ideas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NULL,
    quick_story_id INT NULL,
    idea_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (quick_story_id) REFERENCES quick_stories(id) ON DELETE CASCADE,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    INDEX idx_book_id (book_id),
    INDEX idx_quick_story_id (quick_story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Characters table (supports both books and quick stories)
CREATE TABLE characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NULL,
    quick_story_id INT NULL,
    character_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    avatar LONGTEXT, -- base64 image data
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(100),
    backstory TEXT,
    characterization TEXT,
    voice TEXT,
    appearance TEXT,
    friends_family TEXT, -- matches friendsFamily from localStorage
    favorites TEXT,
    misc TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (quick_story_id) REFERENCES quick_stories(id) ON DELETE CASCADE,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    INDEX idx_book_id (book_id),
    INDEX idx_quick_story_id (quick_story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Stories table (supports both books and quick stories)
CREATE TABLE stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NULL,
    quick_story_id INT NULL,
    story_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    content LONGTEXT, -- JSON string of Quill delta format
    word_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (quick_story_id) REFERENCES quick_stories(id) ON DELETE CASCADE,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    INDEX idx_book_id (book_id),
    INDEX idx_quick_story_id (quick_story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Chapters table (supports both books and quick stories)
CREATE TABLE chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NULL,
    quick_story_id INT NULL,
    chapter_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    content LONGTEXT, -- JSON string of Quill delta format
    word_count INT DEFAULT 0,
    chapter_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (quick_story_id) REFERENCES quick_stories(id) ON DELETE CASCADE,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    INDEX idx_book_id (book_id),
    INDEX idx_quick_story_id (quick_story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Outlines table (supports both books and quick stories)
CREATE TABLE outlines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NULL,
    quick_story_id INT NULL,
    outline_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    content LONGTEXT, -- JSON string of Quill delta format
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (quick_story_id) REFERENCES quick_stories(id) ON DELETE CASCADE,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    INDEX idx_book_id (book_id),
    INDEX idx_quick_story_id (quick_story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Parts table (supports both books and quick stories, stores chapter/story IDs as JSON)
CREATE TABLE parts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NULL,
    quick_story_id INT NULL,
    part_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    chapter_ids JSON DEFAULT (JSON_ARRAY()), -- matches localStorage structure
    story_ids JSON DEFAULT (JSON_ARRAY()), -- matches localStorage structure
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (quick_story_id) REFERENCES quick_stories(id) ON DELETE CASCADE,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    INDEX idx_book_id (book_id),
    INDEX idx_quick_story_id (quick_story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Note Cards table (supports both books and quick stories)
CREATE TABLE note_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NULL,
    quick_story_id INT NULL,
    notecard_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    content TEXT,
    color ENUM('yellow', 'red', 'blue', 'green', 'gray') DEFAULT 'yellow',
    linked_idea_ids JSON DEFAULT (JSON_ARRAY()),
    linked_character_ids JSON DEFAULT (JSON_ARRAY()),
    linked_chapter_ids JSON DEFAULT (JSON_ARRAY()),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (quick_story_id) REFERENCES quick_stories(id) ON DELETE CASCADE,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    INDEX idx_book_id (book_id),
    INDEX idx_quick_story_id (quick_story_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Recent Activities table (supports both books and quick stories)
CREATE TABLE recent_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NULL,
    quick_story_id INT NULL,
    activity_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    type ENUM('idea', 'character', 'story', 'chapter', 'outline', 'part', 'book', 'notecard') NOT NULL,
    title VARCHAR(500) NOT NULL, -- title when action occurred
    action ENUM('created', 'modified', 'deleted') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (quick_story_id) REFERENCES quick_stories(id) ON DELETE CASCADE,
    
    -- Allow global activities (both IDs can be null) or specific parent
    CONSTRAINT check_valid_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL) OR
        (book_id IS NULL AND quick_story_id IS NULL)
    ),
    UNIQUE KEY unique_activity (user_id, activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Show created tables
SHOW TABLES;