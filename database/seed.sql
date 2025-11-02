-- ===================================
-- SEED DATA FOR UNIVERSITY CHATBOT
-- Sample data for testing and development
-- ===================================

USE university_chatbot;

-- ===================================
-- INSERT COURSES
-- ===================================
INSERT INTO courses (course_code, course_name, credits, department, level, description, prerequisites, max_students) VALUES
('CS101', 'Introduction to Computer Science', 3, 'Computer Science', 'Undergraduate', 'Fundamental concepts of programming and problem solving', NULL, 50),
('CS201', 'Data Structures and Algorithms', 4, 'Computer Science', 'Undergraduate', 'Study of fundamental data structures and algorithms', 'CS101', 45),
('CS301', 'Database Systems', 3, 'Computer Science', 'Undergraduate', 'Design and implementation of database systems', 'CS201', 40),
('CS401', 'Artificial Intelligence', 4, 'Computer Science', 'Undergraduate', 'Introduction to AI concepts, machine learning, and neural networks', 'CS201', 35),
('MATH101', 'Calculus I', 4, 'Mathematics', 'Undergraduate', 'Limits, derivatives, and integrals', NULL, 60),
('MATH201', 'Linear Algebra', 3, 'Mathematics', 'Undergraduate', 'Vector spaces, matrices, and linear transformations', 'MATH101', 50),
('ENG101', 'English Composition', 3, 'English', 'Undergraduate', 'Academic writing and critical thinking', NULL, 30),
('PHY101', 'Physics I', 4, 'Physics', 'Undergraduate', 'Mechanics and thermodynamics', 'MATH101', 45),
('BUS201', 'Business Analytics', 3, 'Business', 'Undergraduate', 'Data-driven decision making in business', NULL, 40),
('CS501', 'Machine Learning', 4, 'Computer Science', 'Graduate', 'Advanced machine learning techniques and applications', 'CS401', 25);

-- ===================================
-- INSERT INSTRUCTORS
-- ===================================
INSERT INTO instructors (first_name, last_name, email, department, office_location, phone, office_hours) VALUES
('John', 'Smith', 'john.smith@university.edu', 'Computer Science', 'CS Building Room 301', '555-0101', 'Mon/Wed 2-4 PM'),
('Sarah', 'Johnson', 'sarah.johnson@university.edu', 'Computer Science', 'CS Building Room 305', '555-0102', 'Tue/Thu 10-12 PM'),
('Michael', 'Brown', 'michael.brown@university.edu', 'Computer Science', 'CS Building Room 310', '555-0103', 'Mon/Wed/Fri 1-3 PM'),
('Emily', 'Davis', 'emily.davis@university.edu', 'Mathematics', 'Math Building Room 205', '555-0104', 'Tue/Thu 3-5 PM'),
('David', 'Wilson', 'david.wilson@university.edu', 'Mathematics', 'Math Building Room 210', '555-0105', 'Mon/Wed 11-1 PM'),
('Jennifer', 'Taylor', 'jennifer.taylor@university.edu', 'English', 'Humanities Building Room 105', '555-0106', 'Tue/Thu 9-11 AM'),
('Robert', 'Anderson', 'robert.anderson@university.edu', 'Physics', 'Science Building Room 401', '555-0107', 'Mon/Wed/Fri 10-12 PM'),
('Lisa', 'Martinez', 'lisa.martinez@university.edu', 'Business', 'Business Building Room 201', '555-0108', 'Tue/Thu 2-4 PM');

-- ===================================
-- INSERT SCHEDULES
-- ===================================
INSERT INTO schedules (course_id, instructor_id, semester, year, days_of_week, start_time, end_time, location, section, enrolled_students) VALUES
-- Fall 2025
(1, 1, 'Fall', 2025, 'MWF', '09:00:00', '09:50:00', 'CS Building Room 101', 'A', 42),
(1, 1, 'Fall', 2025, 'MWF', '11:00:00', '11:50:00', 'CS Building Room 101', 'B', 38),
(2, 2, 'Fall', 2025, 'TTh', '10:00:00', '11:50:00', 'CS Building Room 102', 'A', 35),
(3, 3, 'Fall', 2025, 'MWF', '13:00:00', '13:50:00', 'CS Building Room 103', 'A', 28),
(4, 3, 'Fall', 2025, 'TTh', '14:00:00', '15:50:00', 'CS Building Room 104', 'A', 30),
(5, 4, 'Fall', 2025, 'MWF', '08:00:00', '08:50:00', 'Math Building Room 101', 'A', 55),
(5, 5, 'Fall', 2025, 'TTh', '09:00:00', '10:50:00', 'Math Building Room 102', 'B', 52),
(6, 5, 'Fall', 2025, 'MWF', '10:00:00', '10:50:00', 'Math Building Room 103', 'A', 45),
(7, 6, 'Fall', 2025, 'TTh', '11:00:00', '12:50:00', 'Humanities Building Room 201', 'A', 25),
(8, 7, 'Fall', 2025, 'MWF', '14:00:00', '14:50:00', 'Science Building Room 301', 'A', 40),
(9, 8, 'Fall', 2025, 'TTh', '13:00:00', '14:50:00', 'Business Building Room 101', 'A', 35),
(10, 2, 'Fall', 2025, 'MW', '16:00:00', '17:50:00', 'CS Building Room 105', 'A', 20);

-- ===================================
-- INSERT INTENTS
-- ===================================
INSERT INTO intents (intent_name, description, category, confidence_threshold) VALUES
('course_info', 'User wants information about a specific course', 'course', 0.75),
('course_schedule', 'User wants to know when a course is offered', 'course', 0.75),
('course_prerequisites', 'User asks about course prerequisites', 'course', 0.80),
('instructor_info', 'User wants information about an instructor', 'instructor', 0.75),
('instructor_office_hours', 'User asks about instructor office hours', 'instructor', 0.75),
('course_availability', 'User asks if course has available seats', 'enrollment', 0.75),
('department_courses', 'User wants list of courses in a department', 'course', 0.70),
('greeting', 'User greets the chatbot', 'general', 0.60),
('thanks', 'User thanks the chatbot', 'general', 0.60),
('help', 'User asks for help or capabilities', 'general', 0.70),
('course_credits', 'User asks about course credit hours', 'course', 0.75),
('course_location', 'User asks where a course is held', 'course', 0.75);

-- ===================================
-- INSERT RESPONSE TEMPLATES
-- ===================================
INSERT INTO responses (intent_id, response_template, priority, is_active) VALUES
(1, 'The course {{course_code}} ({{course_name}}) is a {{credits}}-credit course offered by the {{department}} department. {{description}}', 1, TRUE),
(2, '{{course_code}} is scheduled for {{days_of_week}} from {{start_time}} to {{end_time}} in {{location}} during {{semester}} {{year}}, Section {{section}}.', 1, TRUE),
(3, 'The prerequisites for {{course_code}} are: {{prerequisites}}.', 1, TRUE),
(3, '{{course_code}} has no prerequisites. It is an introductory course.', 2, TRUE),
(4, 'Professor {{instructor_name}} is from the {{department}} department. Email: {{email}}, Office: {{office_location}}, Phone: {{phone}}.', 1, TRUE),
(5, 'Professor {{instructor_name}}''s office hours are: {{office_hours}}.', 1, TRUE),
(6, '{{course_code}} currently has {{available_seats}} seats available out of {{max_students}} total seats.', 1, TRUE),
(7, 'The {{department}} department offers the following courses: {{course_list}}.', 1, TRUE),
(8, 'Hello! I''m the University Chatbot. I can help you with course information, schedules, instructor details, and more. How can I assist you today?', 1, TRUE),
(9, 'You''re welcome! Is there anything else I can help you with?', 1, TRUE),
(10, 'I can help you with:\n- Course information and schedules\n- Instructor details and office hours\n- Prerequisites and course requirements\n- Department course listings\n- Course availability\n\nJust ask me a question!', 1, TRUE),
(11, '{{course_code}} is worth {{credits}} credit hours.', 1, TRUE),
(12, '{{course_code}} meets in {{location}}.', 1, TRUE);

-- ===================================
-- INSERT ENTITY TYPES
-- ===================================
INSERT INTO entity_types (entity_name, description, extraction_pattern, validation_rule) VALUES
('course_code', 'Course identifier (e.g., CS101, MATH201)', '[A-Z]{2,4}\\d{3}', '^[A-Z]{2,4}\\d{3}$'),
('instructor_name', 'Full name of instructor', '(Dr\\.|Prof\\.|Professor)?\\s*[A-Z][a-z]+\\s+[A-Z][a-z]+', NULL),
('department', 'Academic department name', NULL, NULL),
('semester', 'Academic semester (Fall, Spring, Summer)', '(Fall|Spring|Summer)', '^(Fall|Spring|Summer)$'),
('time', 'Time reference (morning, afternoon, evening)', '(morning|afternoon|evening|\\d{1,2}:\\d{2})', NULL),
('day', 'Day of week', '(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)', NULL);

-- ===================================
-- INSERT SAMPLE QUERIES FOR TESTING
-- ===================================
INSERT INTO queries (session_id, user_message, bot_response, intent_detected, confidence_score, entities_extracted, response_time_ms, was_resolved) VALUES
('session_001', 'What is CS101?', 'The course CS101 (Introduction to Computer Science) is a 3-credit course offered by the Computer Science department.', 'course_info', 0.95, '{"course_code": "CS101"}', 245, TRUE),
('session_002', 'When is CS201 offered?', 'CS201 is scheduled for TTh from 10:00 AM to 11:50 AM in CS Building Room 102 during Fall 2025, Section A.', 'course_schedule', 0.92, '{"course_code": "CS201"}', 310, TRUE),
('session_003', 'Tell me about Professor Smith', 'Professor John Smith is from the Computer Science department. Email: john.smith@university.edu, Office: CS Building Room 301, Phone: 555-0101.', 'instructor_info', 0.88, '{"instructor_name": "Smith"}', 280, TRUE),
('session_004', 'What are the prerequisites for CS301?', 'The prerequisites for CS301 are: CS201.', 'course_prerequisites', 0.94, '{"course_code": "CS301"}', 190, TRUE),
('session_005', 'Hello', 'Hello! I''m the University Chatbot. I can help you with course information, schedules, instructor details, and more. How can I assist you today?', 'greeting', 0.98, '{}', 150, TRUE);

-- ===================================
-- INSERT INITIAL ANALYTICS
-- ===================================
INSERT INTO analytics_daily (date, total_queries, resolved_queries, avg_confidence, avg_response_time_ms, unique_sessions, accuracy_rate) VALUES
('2025-11-01', 5, 5, 0.9340, 235, 5, 1.0000);

-- ===================================
-- END OF SEED DATA
-- ===================================
