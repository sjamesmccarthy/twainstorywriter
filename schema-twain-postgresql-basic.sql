-- Twain Story Builder Database Schema - PostgreSQL Basic Version
-- Created: October 3, 2025
-- This schema mirrors the localStorage structure for easier migration
-- Basic version without complex triggers, stored procedures, or views

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS recent_activities CASCADE;
DROP TABLE IF EXISTS part_chapters CASCADE;
DROP TABLE IF EXISTS part_stories CASCADE;
DROP TABLE IF EXISTS parts CASCADE;
DROP TABLE IF EXISTS note_cards CASCADE;
DROP TABLE IF EXISTS outlines CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
DROP TABLE IF EXISTS quick_stories CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS global_settings CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS user_status_type CASCADE;
DROP TYPE IF EXISTS plan_type_enum CASCADE;
DROP TYPE IF EXISTS plan_status_enum CASCADE;
DROP TYPE IF EXISTS theme_enum CASCADE;
DROP TYPE IF EXISTS default_view_enum CASCADE;
DROP TYPE IF EXISTS export_format_enum CASCADE;
DROP TYPE IF EXISTS age_group_enum CASCADE;
DROP TYPE IF EXISTS activity_type_enum CASCADE;
DROP TYPE IF EXISTS activity_action_enum CASCADE;

-- Create custom ENUM types
CREATE TYPE user_status_type AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE plan_type_enum AS ENUM ('freelance', 'professional');
CREATE TYPE plan_status_enum AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE theme_enum AS ENUM ('light', 'dark', 'auto');
CREATE TYPE default_view_enum AS ENUM ('bookshelf', 'write', 'manage');
CREATE TYPE export_format_enum AS ENUM ('pdf', 'docx', 'txt', 'html');
CREATE TYPE age_group_enum AS ENUM ('Adult', 'Teen', 'Child');
CREATE TYPE activity_type_enum AS ENUM ('idea', 'character', 'story', 'chapter', 'outline', 'part', 'book', 'notecard');
CREATE TYPE activity_action_enum AS ENUM ('created', 'modified', 'deleted');

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image TEXT,
    provider VARCHAR(50) DEFAULT 'google',
    provider_id VARCHAR(255),
    account_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    login_count INTEGER DEFAULT 1,
    status user_status_type DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create User Preferences table (matches localStorage UserPreferences interface)
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Plan and subscription info
    plan_type plan_type_enum DEFAULT 'freelance',
    plan_status plan_status_enum DEFAULT 'active',
    plan_start_date TIMESTAMP WITH TIME ZONE,
    plan_end_date TIMESTAMP WITH TIME ZONE,
    plan_features JSONB DEFAULT '["local-storage", "basic-writing", "export-txt", "up-to-1-book"]'::jsonb,
    
    -- Account metadata (from localStorage)
    account_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    login_count INTEGER DEFAULT 1,
    
    -- User interface preferences
    theme theme_enum DEFAULT 'auto',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    default_view default_view_enum DEFAULT 'bookshelf',
    
    -- Writing preferences
    auto_save BOOLEAN DEFAULT TRUE,
    auto_save_interval INTEGER DEFAULT 30,
    word_count_goal INTEGER,
    preferred_font_size INTEGER DEFAULT 14,
    preferred_font_family VARCHAR(255) DEFAULT '''Rubik'', sans-serif',
    
    -- Notification preferences
    show_notifications BOOLEAN DEFAULT TRUE,
    show_word_count_notifications BOOLEAN DEFAULT TRUE,
    show_save_notifications BOOLEAN DEFAULT TRUE,
    
    -- Export preferences
    default_export_format export_format_enum DEFAULT 'pdf',
    include_metadata_in_export BOOLEAN DEFAULT TRUE,
    
    -- Privacy and data preferences
    analytics_opt_in BOOLEAN DEFAULT FALSE,
    share_usage_data BOOLEAN DEFAULT FALSE,
    
    -- Feature flags and beta access
    beta_features JSONB DEFAULT '[]'::jsonb,
    experimental_features JSONB DEFAULT '[]'::jsonb,
    
    -- Recent activity tracking (array of IDs from localStorage)
    recent_books JSONB DEFAULT '[]'::jsonb,
    recent_stories JSONB DEFAULT '[]'::jsonb,
    
    -- Custom settings
    custom_settings JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Create Books table (matches localStorage Book interface)
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    author VARCHAR(255) NOT NULL,
    edition VARCHAR(100) DEFAULT 'First Edition',
    copyright_year VARCHAR(4) NOT NULL,
    word_count INTEGER DEFAULT 0,
    target_word_count INTEGER DEFAULT 0,
    cover_image TEXT, -- base64 encoded image data
    
    -- Series information
    is_series BOOLEAN DEFAULT FALSE,
    series_name VARCHAR(255),
    series_number INTEGER,
    
    -- Metadata
    description TEXT,
    genre VARCHAR(100),
    age_group age_group_enum DEFAULT 'Adult',
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
    contributors JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Quick Stories table (separate from books, matches localStorage)
CREATE TABLE quick_stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    description TEXT,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Global Settings table (for settings like aboutAuthor that are stored globally)
CREATE TABLE global_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_setting UNIQUE (user_id, setting_key)
);

-- Create Ideas table (supports both books and quick stories)
CREATE TABLE ideas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    idea_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    )
);

-- Create Characters table (supports both books and quick stories)
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    character_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    avatar TEXT, -- base64 image data
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(100),
    backstory TEXT,
    characterization TEXT,
    voice TEXT,
    appearance TEXT,
    friends_family TEXT, -- matches friendsFamily from localStorage
    favorites TEXT,
    misc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    )
);

-- Create Stories table (supports both books and quick stories)
CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    story_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    content TEXT, -- JSON string of Quill delta format
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    )
);

-- Create Chapters table (supports both books and quick stories)
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    chapter_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    content TEXT, -- JSON string of Quill delta format
    word_count INTEGER DEFAULT 0,
    chapter_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    )
);

-- Create Outlines table (supports both books and quick stories)
CREATE TABLE outlines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    outline_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    content TEXT, -- JSON string of Quill delta format
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    )
);

-- Create Parts table (supports both books and quick stories, stores chapter/story IDs as JSONB)
CREATE TABLE parts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    part_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    chapter_ids JSONB DEFAULT '[]'::jsonb, -- matches localStorage structure
    story_ids JSONB DEFAULT '[]'::jsonb, -- matches localStorage structure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    )
);

-- Create Note Cards table (supports both books and quick stories)
CREATE TABLE note_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    notecard_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    title VARCHAR(500) NOT NULL,
    content TEXT,
    color VARCHAR(20) DEFAULT 'yellow' CHECK (color IN ('yellow', 'red', 'blue', 'green', 'gray')),
    linked_idea_ids JSONB DEFAULT '[]'::jsonb,
    linked_character_ids JSONB DEFAULT '[]'::jsonb,
    linked_chapter_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one parent is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    )
);

-- Create Recent Activities table (supports both books and quick stories)
CREATE TABLE recent_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    activity_id VARCHAR(50) NOT NULL, -- original ID from localStorage
    type activity_type_enum NOT NULL,
    title VARCHAR(500) NOT NULL, -- title when action occurred
    action activity_action_enum NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Allow global activities (both IDs can be null) or specific parent
    CONSTRAINT check_valid_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL) OR
        (book_id IS NULL AND quick_story_id IS NULL)
    ),
    CONSTRAINT unique_activity UNIQUE (user_id, activity_id)
);

-- Create basic indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_updated_at ON books(updated_at);

CREATE INDEX idx_quick_stories_user_id ON quick_stories(user_id);
CREATE INDEX idx_quick_stories_updated_at ON quick_stories(updated_at);

CREATE INDEX idx_global_settings_user_id ON global_settings(user_id);
CREATE INDEX idx_global_settings_key ON global_settings(setting_key);

CREATE INDEX idx_ideas_book_id ON ideas(book_id);
CREATE INDEX idx_ideas_quick_story_id ON ideas(quick_story_id);

CREATE INDEX idx_characters_book_id ON characters(book_id);
CREATE INDEX idx_characters_quick_story_id ON characters(quick_story_id);

CREATE INDEX idx_stories_book_id ON stories(book_id);
CREATE INDEX idx_stories_quick_story_id ON stories(quick_story_id);

CREATE INDEX idx_chapters_book_id ON chapters(book_id);
CREATE INDEX idx_chapters_quick_story_id ON chapters(quick_story_id);

CREATE INDEX idx_outlines_book_id ON outlines(book_id);
CREATE INDEX idx_outlines_quick_story_id ON outlines(quick_story_id);

CREATE INDEX idx_parts_book_id ON parts(book_id);
CREATE INDEX idx_parts_quick_story_id ON parts(quick_story_id);

CREATE INDEX idx_note_cards_book_id ON note_cards(book_id);
CREATE INDEX idx_note_cards_quick_story_id ON note_cards(quick_story_id);

CREATE INDEX idx_recent_activities_user_id ON recent_activities(user_id);
CREATE INDEX idx_recent_activities_timestamp ON recent_activities(timestamp);

-- Show created objects
\dt
\dT
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;