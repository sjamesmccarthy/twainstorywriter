-- Twain Story Builder Database Schema - PostgreSQL Version
-- Created: September 30, 2025
-- This schema supports the complete Twain Story Builder application

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

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider_id ON users(provider_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_login_count ON users(login_count);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- Create User Preferences table
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Plan and subscription info
    plan_type plan_type_enum DEFAULT 'freelance',
    plan_status plan_status_enum DEFAULT 'active',
    plan_start_date TIMESTAMP WITH TIME ZONE,
    plan_end_date TIMESTAMP WITH TIME ZONE,
    plan_features JSONB DEFAULT '["local-storage", "basic-writing", "export-txt", "up-to-1-book"]'::jsonb,
    
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
    
    -- Recent activity tracking
    recent_books JSONB DEFAULT '[]'::jsonb,
    recent_stories JSONB DEFAULT '[]'::jsonb,
    
    -- Custom settings
    custom_settings JSONB DEFAULT '{}'::jsonb,
    
    -- Author information
    about_author TEXT, -- New field for author biography (up to 350 words)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Create Books table
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
    
    -- Contributors stored as JSONB array
    -- Format: [{"id": "contrib1", "role": "Editor", "firstName": "John", "lastName": "Doe"}, ...]
    -- Possible roles: Co-Author, Editor, Illustrator, Photographer, Translator, 
    --                Foreword, Introduction, Preface, Agent, Proof Reader, Advisor, Typesetter
    contributors JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for books table
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_is_series ON books(is_series);
CREATE INDEX idx_books_series_name ON books(series_name);
CREATE INDEX idx_books_word_count ON books(word_count);
CREATE INDEX idx_books_updated_at ON books(updated_at);

-- Create Quick Stories table (separate from books for quick story mode)
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

-- Create indexes for quick_stories table
CREATE INDEX idx_quick_stories_user_id ON quick_stories(user_id);
CREATE INDEX idx_quick_stories_word_count ON quick_stories(word_count);
CREATE INDEX idx_quick_stories_updated_at ON quick_stories(updated_at);

-- Create Global Settings table for application-wide settings
CREATE TABLE global_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_setting UNIQUE (user_id, setting_key)
);

-- Create indexes for global_settings table
CREATE INDEX idx_global_settings_user_id ON global_settings(user_id);
CREATE INDEX idx_global_settings_key ON global_settings(setting_key);

-- Create Ideas table
CREATE TABLE ideas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    idea_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one of book_id or quick_story_id is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    CONSTRAINT unique_book_idea UNIQUE (book_id, idea_id),
    CONSTRAINT unique_quickstory_idea UNIQUE (quick_story_id, idea_id)
);

-- Create Characters table
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    character_id VARCHAR(50) NOT NULL,
    avatar TEXT, -- base64 image data
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(100),
    backstory TEXT,
    characterization TEXT,
    voice TEXT,
    appearance TEXT,
    friends_family TEXT, -- Updated to match localStorage structure (friendsFamily)
    favorites TEXT,
    misc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one of book_id or quick_story_id is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    CONSTRAINT unique_book_character UNIQUE (book_id, character_id),
    CONSTRAINT unique_quickstory_character UNIQUE (quick_story_id, character_id)
);

-- Create Stories table (for quick stories and book stories)
CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    story_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT, -- JSON string of Quill delta
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one of book_id or quick_story_id is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    CONSTRAINT unique_book_story UNIQUE (book_id, story_id),
    CONSTRAINT unique_quickstory_story UNIQUE (quick_story_id, story_id)
);

-- Create Chapters table
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    chapter_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT, -- JSON string of Quill delta
    word_count INTEGER DEFAULT 0,
    chapter_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one of book_id or quick_story_id is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    CONSTRAINT unique_book_chapter UNIQUE (book_id, chapter_id),
    CONSTRAINT unique_quickstory_chapter UNIQUE (quick_story_id, chapter_id)
);

-- Create indexes for chapters table
CREATE INDEX idx_chapters_updated_at ON chapters(updated_at);

-- Create Outlines table
CREATE TABLE outlines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    outline_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT, -- JSON string of Quill delta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one of book_id or quick_story_id is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    CONSTRAINT unique_book_outline UNIQUE (book_id, outline_id),
    CONSTRAINT unique_quickstory_outline UNIQUE (quick_story_id, outline_id)
);

-- Create Parts table
CREATE TABLE parts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    part_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one of book_id or quick_story_id is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    CONSTRAINT unique_book_part UNIQUE (book_id, part_id),
    CONSTRAINT unique_quickstory_part UNIQUE (quick_story_id, part_id)
);

-- Create Note Cards table (missing from original schema but exists in localStorage)
CREATE TABLE note_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    notecard_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    color VARCHAR(20) DEFAULT 'yellow' CHECK (color IN ('yellow', 'red', 'blue', 'green', 'gray')),
    linked_idea_ids JSONB DEFAULT '[]'::jsonb,
    linked_character_ids JSONB DEFAULT '[]'::jsonb,
    linked_chapter_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one of book_id or quick_story_id is set
    CONSTRAINT check_one_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL)
    ),
    CONSTRAINT unique_book_notecard UNIQUE (book_id, notecard_id),
    CONSTRAINT unique_quickstory_notecard UNIQUE (quick_story_id, notecard_id)
);

-- Create Part-Chapter relationship table
CREATE TABLE part_chapters (
    id SERIAL PRIMARY KEY,
    part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    chapter_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_part_chapter UNIQUE (part_id, chapter_id)
);

-- Create index for part_chapters
CREATE INDEX idx_chapter_order_in_part ON part_chapters(part_id, chapter_order);

-- Create Part-Story relationship table
CREATE TABLE part_stories (
    id SERIAL PRIMARY KEY,
    part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    story_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_part_story UNIQUE (part_id, story_id)
);

-- Create index for part_stories
CREATE INDEX idx_story_order_in_part ON part_stories(part_id, story_order);

-- Create indexes for note_cards table
CREATE INDEX idx_note_cards_user_id ON note_cards(user_id);
CREATE INDEX idx_note_cards_book_id ON note_cards(book_id);
CREATE INDEX idx_note_cards_color ON note_cards(color);
CREATE INDEX idx_note_cards_updated_at ON note_cards(updated_at);

-- Create Recent Activities table for tracking user actions
CREATE TABLE recent_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    quick_story_id INTEGER REFERENCES quick_stories(id) ON DELETE CASCADE,
    activity_id VARCHAR(50) NOT NULL, -- Unique ID for the log entry
    type activity_type_enum NOT NULL,
    title VARCHAR(500) NOT NULL, -- Title of the item when the action occurred
    action activity_action_enum NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one of book_id or quick_story_id is set (or both can be null for global activities)
    CONSTRAINT check_valid_parent CHECK (
        (book_id IS NOT NULL AND quick_story_id IS NULL) OR
        (book_id IS NULL AND quick_story_id IS NOT NULL) OR
        (book_id IS NULL AND quick_story_id IS NULL)
    ),
    CONSTRAINT unique_activity UNIQUE (user_id, activity_id)
);

-- Create indexes for recent_activities
CREATE INDEX idx_recent_activities_user_id ON recent_activities(user_id);
CREATE INDEX idx_recent_activities_book_id ON recent_activities(book_id);
CREATE INDEX idx_recent_activities_quick_story_id ON recent_activities(quick_story_id);
CREATE INDEX idx_recent_activities_timestamp ON recent_activities(timestamp);

-- Create indexes for stories table
CREATE INDEX idx_stories_updated_at ON stories(updated_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at 
    BEFORE UPDATE ON books 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_stories_updated_at 
    BEFORE UPDATE ON quick_stories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_settings_updated_at 
    BEFORE UPDATE ON global_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at 
    BEFORE UPDATE ON ideas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at 
    BEFORE UPDATE ON characters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at 
    BEFORE UPDATE ON stories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at 
    BEFORE UPDATE ON chapters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outlines_updated_at 
    BEFORE UPDATE ON outlines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at 
    BEFORE UPDATE ON parts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_cards_updated_at 
    BEFORE UPDATE ON note_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate word count from content
CREATE OR REPLACE FUNCTION calculate_word_count(content_text TEXT)
RETURNS INTEGER AS $$
DECLARE
    word_count INTEGER := 0;
    content_json JSONB;
    ops JSONB;
    op JSONB;
    insert_text TEXT;
BEGIN
    -- Handle null or empty content
    IF content_text IS NULL OR content_text = '' THEN
        RETURN 0;
    END IF;
    
    -- Try to parse as JSON (Quill delta format)
    BEGIN
        content_json := content_text::JSONB;
        
        -- Check if it has 'ops' array (Quill delta format)
        IF content_json ? 'ops' THEN
            ops := content_json->'ops';
            
            -- Iterate through operations
            FOR op IN SELECT * FROM jsonb_array_elements(ops)
            LOOP
                -- Check if operation has 'insert' and it's text
                IF op ? 'insert' AND jsonb_typeof(op->'insert') = 'string' THEN
                    insert_text := op->>'insert';
                    -- Count words (split by whitespace and filter non-empty)
                    SELECT array_length(
                        array_remove(
                            string_to_array(
                                regexp_replace(insert_text, '[^\w\s]', ' ', 'g'),
                                ' '
                            ),
                            ''
                        ),
                        1
                    ) INTO word_count;
                    word_count := COALESCE(word_count, 0);
                END IF;
            END LOOP;
        ELSE
            -- If not Quill format, treat as plain text
            SELECT array_length(
                array_remove(
                    string_to_array(
                        regexp_replace(content_text, '[^\w\s]', ' ', 'g'),
                        ' '
                    ),
                    ''
                ),
                1
            ) INTO word_count;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- If JSON parsing fails, treat as plain text
        SELECT array_length(
            array_remove(
                string_to_array(
                    regexp_replace(content_text, '[^\w\s]', ' ', 'g'),
                    ' '
                ),
                ''
            ),
            1
        ) INTO word_count;
    END;
    
    RETURN COALESCE(word_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to update book word count
CREATE OR REPLACE FUNCTION update_book_word_count(book_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    total_words INTEGER := 0;
    chapter_words INTEGER := 0;
    story_words INTEGER := 0;
BEGIN
    -- Calculate total words from chapters
    SELECT COALESCE(SUM(word_count), 0) INTO chapter_words
    FROM chapters 
    WHERE book_id = book_id_param;
    
    -- Calculate total words from stories
    SELECT COALESCE(SUM(word_count), 0) INTO story_words
    FROM stories 
    WHERE book_id = book_id_param;
    
    total_words := chapter_words + story_words;
    
    -- Update the book's word count
    UPDATE books 
    SET word_count = total_words, updated_at = CURRENT_TIMESTAMP
    WHERE id = book_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to update quick story word count
CREATE OR REPLACE FUNCTION update_quick_story_word_count(quick_story_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    total_words INTEGER := 0;
    chapter_words INTEGER := 0;
    story_words INTEGER := 0;
BEGIN
    -- Calculate total words from chapters
    SELECT COALESCE(SUM(word_count), 0) INTO chapter_words
    FROM chapters 
    WHERE quick_story_id = quick_story_id_param;
    
    -- Calculate total words from stories
    SELECT COALESCE(SUM(word_count), 0) INTO story_words
    FROM stories 
    WHERE quick_story_id = quick_story_id_param;
    
    total_words := chapter_words + story_words;
    
    -- Update the quick story's word count
    UPDATE quick_stories 
    SET word_count = total_words, updated_at = CURRENT_TIMESTAMP
    WHERE id = quick_story_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update word counts

-- Function to update chapter word count and then book/quick story word count
CREATE OR REPLACE FUNCTION update_chapter_word_count()
RETURNS TRIGGER AS $$
DECLARE
    new_word_count INTEGER;
BEGIN
    -- Calculate word count for the new/updated chapter
    IF TG_OP = 'DELETE' THEN
        -- For delete operations, update the parent word count
        IF OLD.book_id IS NOT NULL THEN
            PERFORM update_book_word_count(OLD.book_id);
        ELSIF OLD.quick_story_id IS NOT NULL THEN
            PERFORM update_quick_story_word_count(OLD.quick_story_id);
        END IF;
        RETURN OLD;
    ELSE
        -- Calculate word count from content
        new_word_count := calculate_word_count(NEW.content);
        NEW.word_count := new_word_count;
        
        -- Update parent word count
        IF NEW.book_id IS NOT NULL THEN
            PERFORM update_book_word_count(NEW.book_id);
        ELSIF NEW.quick_story_id IS NOT NULL THEN
            PERFORM update_quick_story_word_count(NEW.quick_story_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update story word count and then book/quick story word count
CREATE OR REPLACE FUNCTION update_story_word_count()
RETURNS TRIGGER AS $$
DECLARE
    new_word_count INTEGER;
BEGIN
    -- Calculate word count for the new/updated story
    IF TG_OP = 'DELETE' THEN
        -- For delete operations, update the parent word count
        IF OLD.book_id IS NOT NULL THEN
            PERFORM update_book_word_count(OLD.book_id);
        ELSIF OLD.quick_story_id IS NOT NULL THEN
            PERFORM update_quick_story_word_count(OLD.quick_story_id);
        END IF;
        RETURN OLD;
    ELSE
        -- Calculate word count from content
        new_word_count := calculate_word_count(NEW.content);
        NEW.word_count := new_word_count;
        
        -- Update parent word count
        IF NEW.book_id IS NOT NULL THEN
            PERFORM update_book_word_count(NEW.book_id);
        ELSIF NEW.quick_story_id IS NOT NULL THEN
            PERFORM update_quick_story_word_count(NEW.quick_story_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for word count updates
CREATE TRIGGER trigger_update_chapter_word_count
    BEFORE INSERT OR UPDATE ON chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_chapter_word_count();

CREATE TRIGGER trigger_update_chapter_word_count_delete
    AFTER DELETE ON chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_chapter_word_count();

CREATE TRIGGER trigger_update_story_word_count
    BEFORE INSERT OR UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_story_word_count();

CREATE TRIGGER trigger_update_story_word_count_delete
    AFTER DELETE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_story_word_count();

-- Create views for common queries

-- View for getting book statistics
CREATE VIEW book_stats AS
SELECT 
    b.id,
    b.title,
    b.user_id,
    b.word_count,
    COUNT(DISTINCT c.id) as chapter_count,
    COUNT(DISTINCT s.id) as story_count,
    COUNT(DISTINCT ch.id) as character_count,
    COUNT(DISTINCT i.id) as idea_count,
    COUNT(DISTINCT o.id) as outline_count,
    COUNT(DISTINCT p.id) as part_count,
    COUNT(DISTINCT nc.id) as notecard_count
FROM books b
LEFT JOIN chapters c ON b.id = c.book_id
LEFT JOIN stories s ON b.id = s.book_id
LEFT JOIN characters ch ON b.id = ch.book_id
LEFT JOIN ideas i ON b.id = i.book_id
LEFT JOIN outlines o ON b.id = o.book_id
LEFT JOIN parts p ON b.id = p.book_id
LEFT JOIN note_cards nc ON b.id = nc.book_id
GROUP BY b.id, b.title, b.user_id, b.word_count;

-- View for getting quick story statistics
CREATE VIEW quick_story_stats AS
SELECT 
    qs.id,
    qs.title,
    qs.user_id,
    qs.word_count,
    COUNT(DISTINCT c.id) as chapter_count,
    COUNT(DISTINCT s.id) as story_count,
    COUNT(DISTINCT ch.id) as character_count,
    COUNT(DISTINCT i.id) as idea_count,
    COUNT(DISTINCT o.id) as outline_count,
    COUNT(DISTINCT p.id) as part_count,
    COUNT(DISTINCT nc.id) as notecard_count
FROM quick_stories qs
LEFT JOIN chapters c ON qs.id = c.quick_story_id
LEFT JOIN stories s ON qs.id = s.quick_story_id
LEFT JOIN characters ch ON qs.id = ch.quick_story_id
LEFT JOIN ideas i ON qs.id = i.quick_story_id
LEFT JOIN outlines o ON qs.id = o.quick_story_id
LEFT JOIN parts p ON qs.id = p.quick_story_id
LEFT JOIN note_cards nc ON qs.id = nc.quick_story_id
GROUP BY qs.id, qs.title, qs.user_id, qs.word_count;

-- View for user activity summary
CREATE VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.login_count,
    u.last_login_at,
    COUNT(DISTINCT b.id) as total_books,
    COUNT(DISTINCT qs.id) as total_quick_stories,
    COALESCE(SUM(b.word_count), 0) + COALESCE(SUM(qs.word_count), 0) as total_words,
    u.account_created_at
FROM users u
LEFT JOIN books b ON u.id = b.user_id
LEFT JOIN quick_stories qs ON u.id = qs.user_id
GROUP BY u.id, u.email, u.name, u.login_count, u.last_login_at, u.account_created_at;

-- Insert sample data for testing (optional)
-- You can uncomment these if you want some initial test data

/*
-- Sample user
INSERT INTO users (email, name, image) VALUES 
('test@example.com', 'Test User', 'https://example.com/avatar.jpg');

-- Sample user preferences
INSERT INTO user_preferences (user_id, plan_type) VALUES (1, 'freelance');

-- Sample book with contributors
INSERT INTO books (user_id, title, author, copyright_year, contributors) VALUES 
(1, 'My First Novel', 'Test User', '2025', 
 '[{"id": "contrib1", "role": "Editor", "firstName": "Jane", "lastName": "Smith"}, 
   {"id": "contrib2", "role": "Illustrator", "firstName": "Bob", "lastName": "Wilson"}]'::jsonb);

-- Sample chapter
INSERT INTO chapters (user_id, book_id, chapter_id, title, content, word_count) VALUES 
(1, 1, 'ch1', 'Chapter 1: The Beginning', '{"ops":[{"insert":"It was a dark and stormy night...\\n"}]}', 8);
*/

-- Show created objects
\dt
\dT
\df

-- Display table information
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;