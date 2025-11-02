-- ===================================
-- UNIVERSITY CHATBOT DATABASE SCHEMA
-- MySQL Schema Definition
-- ===================================

-- Drop existing database if exists
DROP DATABASE IF EXISTS university_chatbot;

-- Create database
CREATE DATABASE university_chatbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE university_chatbot;

-- ===================================
-- TABLE: courses
-- Stores course information
-- ===================================
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(200) NOT NULL,
    credits INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    description TEXT,
    prerequisites TEXT,
    max_students INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course_code (course_code),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: instructors
-- Stores faculty/instructor information
-- ===================================
CREATE TABLE instructors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    office_location VARCHAR(100),
    phone VARCHAR(20),
    office_hours TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: schedules
-- Stores class schedules
-- ===================================
CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    instructor_id INT NOT NULL,
    semester VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    days_of_week VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100) NOT NULL,
    section VARCHAR(10) DEFAULT 'A',
    enrolled_students INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    INDEX idx_semester_year (semester, year),
    INDEX idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: intents
-- Stores intent definitions for NLP
-- ===================================
CREATE TABLE intents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    intent_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    confidence_threshold DECIMAL(3,2) DEFAULT 0.75,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_intent_name (intent_name),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: responses
-- Stores response templates
-- ===================================
CREATE TABLE responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    intent_id INT NOT NULL,
    response_template TEXT NOT NULL,
    priority INT DEFAULT 1,
    context_required JSON,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (intent_id) REFERENCES intents(id) ON DELETE CASCADE,
    INDEX idx_intent_id (intent_id),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: queries
-- Stores all user queries and chatbot responses
-- ===================================
CREATE TABLE queries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) NOT NULL,
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(5,4),
    entities_extracted JSON,
    response_time_ms INT,
    was_resolved BOOLEAN DEFAULT FALSE,
    feedback_rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_intent (intent_detected),
    INDEX idx_created_at (created_at),
    INDEX idx_was_resolved (was_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: analytics_daily
-- Stores daily analytics metrics
-- ===================================
CREATE TABLE analytics_daily (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL UNIQUE,
    total_queries INT DEFAULT 0,
    resolved_queries INT DEFAULT 0,
    avg_confidence DECIMAL(5,4),
    avg_response_time_ms INT,
    unique_sessions INT DEFAULT 0,
    accuracy_rate DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: entity_types
-- Stores entity type definitions
-- ===================================
CREATE TABLE entity_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    extraction_pattern VARCHAR(500),
    validation_rule VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_entity_name (entity_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: conversation_context
-- Stores conversation context for multi-turn dialogues
-- ===================================
CREATE TABLE conversation_context (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) NOT NULL,
    context_data JSON NOT NULL,
    last_intent VARCHAR(100),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: feedback
-- Stores user feedback
-- ===================================
CREATE TABLE feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
    INDEX idx_query_id (query_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ===================================

-- View: Course Schedule with Details
CREATE VIEW view_course_schedules AS
SELECT 
    c.course_code,
    c.course_name,
    c.credits,
    c.department,
    CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
    i.email AS instructor_email,
    s.semester,
    s.year,
    s.days_of_week,
    TIME_FORMAT(s.start_time, '%h:%i %p') AS start_time,
    TIME_FORMAT(s.end_time, '%h:%i %p') AS end_time,
    s.location,
    s.section,
    s.enrolled_students,
    c.max_students
FROM schedules s
JOIN courses c ON s.course_id = c.id
JOIN instructors i ON s.instructor_id = i.id;

-- View: Query Analytics
CREATE VIEW view_query_analytics AS
SELECT 
    DATE(created_at) AS query_date,
    COUNT(*) AS total_queries,
    SUM(CASE WHEN was_resolved = TRUE THEN 1 ELSE 0 END) AS resolved_queries,
    AVG(confidence_score) AS avg_confidence,
    AVG(response_time_ms) AS avg_response_time,
    COUNT(DISTINCT session_id) AS unique_sessions,
    ROUND(SUM(CASE WHEN was_resolved = TRUE THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS accuracy_percentage
FROM queries
GROUP BY DATE(created_at);

-- ===================================
-- CREATE STORED PROCEDURES
-- ===================================

DELIMITER $$

-- Procedure: Log Query
CREATE PROCEDURE sp_log_query(
    IN p_session_id VARCHAR(100),
    IN p_user_message TEXT,
    IN p_bot_response TEXT,
    IN p_intent VARCHAR(100),
    IN p_confidence DECIMAL(5,4),
    IN p_entities JSON,
    IN p_response_time INT,
    IN p_was_resolved BOOLEAN
)
BEGIN
    INSERT INTO queries (
        session_id, user_message, bot_response, intent_detected,
        confidence_score, entities_extracted, response_time_ms, was_resolved
    ) VALUES (
        p_session_id, p_user_message, p_bot_response, p_intent,
        p_confidence, p_entities, p_response_time, p_was_resolved
    );
END$$

-- Procedure: Update Daily Analytics
CREATE PROCEDURE sp_update_daily_analytics(IN p_date DATE)
BEGIN
    INSERT INTO analytics_daily (
        date, total_queries, resolved_queries, avg_confidence,
        avg_response_time_ms, unique_sessions, accuracy_rate
    )
    SELECT 
        p_date,
        COUNT(*) AS total_queries,
        SUM(CASE WHEN was_resolved = TRUE THEN 1 ELSE 0 END) AS resolved_queries,
        AVG(confidence_score) AS avg_confidence,
        AVG(response_time_ms) AS avg_response_time_ms,
        COUNT(DISTINCT session_id) AS unique_sessions,
        AVG(CASE WHEN was_resolved = TRUE THEN 1 ELSE 0 END) AS accuracy_rate
    FROM queries
    WHERE DATE(created_at) = p_date
    ON DUPLICATE KEY UPDATE
        total_queries = VALUES(total_queries),
        resolved_queries = VALUES(resolved_queries),
        avg_confidence = VALUES(avg_confidence),
        avg_response_time_ms = VALUES(avg_response_time_ms),
        unique_sessions = VALUES(unique_sessions),
        accuracy_rate = VALUES(accuracy_rate);
END$$

DELIMITER ;

-- ===================================
-- CREATE TRIGGERS
-- ===================================

DELIMITER $$

-- Trigger: Update analytics after query insert
CREATE TRIGGER trg_after_query_insert
AFTER INSERT ON queries
FOR EACH ROW
BEGIN
    CALL sp_update_daily_analytics(DATE(NEW.created_at));
END$$

DELIMITER ;

-- ===================================
-- GRANT PERMISSIONS
-- ===================================
CREATE USER IF NOT EXISTS 'chatbot_user'@'%' IDENTIFIED BY 'your_secure_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON university_chatbot.* TO 'chatbot_user'@'%';
FLUSH PRIVILEGES;

-- ===================================
-- END OF SCHEMA
-- ===================================
