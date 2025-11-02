/**
 * RESPONSE GENERATOR - Generates contextual responses
 * Fetches data from database and creates human-readable responses
 */

const { query } = require('../config/database');
const { logger } = require('../utils/logger');
const { cacheGet, cacheSet } = require('../utils/cache');

/**
 * Generate response based on intent and entities
 * @param {string} intent - Detected intent
 * @param {Object} entities - Extracted entities
 * @param {number} confidence - Intent confidence score
 * @returns {Promise<Object>} Generated response
 */
async function generateResponse(intent, entities, confidence) {
  try {
    // Low confidence fallback
    if (confidence < 0.6) {
      return await handleLowConfidence(intent, entities);
    }

    // Route to appropriate handler based on intent
    const handlers = {
      'greeting': handleGreeting,
      'thanks': handleThanks,
      'help': handleHelp,
      'course_info': handleCourseInfo,
      'course_schedule': handleCourseSchedule,
      'course_prerequisites': handleCoursePrerequisites,
      'instructor_info': handleInstructorInfo,
      'instructor_office_hours': handleInstructorOfficeHours,
      'course_availability': handleCourseAvailability,
      'department_courses': handleDepartmentCourses,
      'course_credits': handleCourseCredits,
      'course_location': handleCourseLocation,
      'unknown': handleUnknown
    };

    const handler = handlers[intent] || handlers['unknown'];
    return await handler(entities);

  } catch (error) {
    logger.error('Response generation failed:', error);
    return {
      success: false,
      response: "I'm sorry, I encountered an error while processing your request. Please try again.",
      error: error.message
    };
  }
}

/**
 * Handle greeting intent
 */
async function handleGreeting(entities) {
  const greetings = [
    "Hello! I'm the University Chatbot. I can help you with course information, schedules, instructor details, and more. How can I assist you today?",
    "Hi there! I'm here to help with your university course queries. What would you like to know?",
    "Greetings! I can answer questions about courses, schedules, instructors, and prerequisites. What can I help you with?"
  ];

  return {
    success: true,
    response: greetings[Math.floor(Math.random() * greetings.length)],
    suggestions: [
      "Tell me about CS101",
      "When is Data Structures offered?",
      "Who teaches AI?"
    ]
  };
}

/**
 * Handle thanks intent
 */
async function handleThanks(entities) {
  const responses = [
    "You're welcome! Is there anything else I can help you with?",
    "Happy to help! Feel free to ask if you have more questions.",
    "My pleasure! Let me know if you need anything else."
  ];

  return {
    success: true,
    response: responses[Math.floor(Math.random() * responses.length)]
  };
}

/**
 * Handle help intent
 */
async function handleHelp(entities) {
  return {
    success: true,
    response: `I can help you with:

📚 **Course Information**
- Course descriptions and details
- Credit hours and requirements

📅 **Schedules**
- Class times and locations
- Semester offerings

👨‍🏫 **Instructors**
- Faculty information
- Office hours and contact details

📋 **Prerequisites**
- Course requirements
- Prerequisite chains

🏢 **Departments**
- Course listings by department
- Department information

Just ask me a question! For example:
- "What is CS101?"
- "When is Database Systems offered?"
- "Who teaches Professor Smith?"
- "What are the prerequisites for AI?"`,
    suggestions: [
      "Show me CS courses",
      "Tell me about MATH201",
      "Who teaches in Computer Science?"
    ]
  };
}

/**
 * Handle course info intent
 */
async function handleCourseInfo(entities) {
  if (!entities.course_codes || entities.course_codes.length === 0) {
    return {
      success: false,
      response: "I'd be happy to provide course information. Could you please specify which course you're interested in? (e.g., CS101, MATH201)"
    };
  }

  const courseCode = entities.course_codes[0];
  const cacheKey = `course_info:${courseCode}`;
  
  // Check cache
  let courseData = await cacheGet(cacheKey);
  if (courseData) {
    courseData = JSON.parse(courseData);
  } else {
    // Fetch from database
    const results = await query(
      `SELECT * FROM courses WHERE course_code = ?`,
      [courseCode]
    );

    if (results.length === 0) {
      return {
        success: false,
        response: `I couldn't find information about ${courseCode}. Please check the course code and try again, or ask me to list courses in a specific department.`,
        suggestions: [
          "Show me all Computer Science courses",
          "List Math courses"
        ]
      };
    }

    courseData = results[0];
    await cacheSet(cacheKey, JSON.stringify(courseData), 3600);
  }

  const prereqText = courseData.prerequisites 
    ? `\n\n📋 **Prerequisites:** ${courseData.prerequisites}`
    : `\n\n📋 **Prerequisites:** None - this is an introductory course.`;

  return {
    success: true,
    response: `**${courseData.course_code}: ${courseData.course_name}**

📚 **Department:** ${courseData.department}
⭐ **Credits:** ${courseData.credits} credit hours
📊 **Level:** ${courseData.level}

📝 **Description:**
${courseData.description}${prereqText}

👥 **Class Size:** Maximum ${courseData.max_students} students`,
    data: courseData,
    suggestions: [
      `When is ${courseCode} offered?`,
      `Who teaches ${courseCode}?`,
      "Show me the prerequisites"
    ]
  };
}

/**
 * Handle course schedule intent
 */
async function handleCourseSchedule(entities) {
  if (!entities.course_codes || entities.course_codes.length === 0) {
    return {
      success: false,
      response: "Which course schedule would you like to see? Please provide a course code (e.g., CS101, MATH201)."
    };
  }

  const courseCode = entities.course_codes[0];
  
  const schedules = await query(`
    SELECT 
      c.course_code, c.course_name,
      CONCAT(i.first_name, ' ', i.last_name) as instructor_name,
      s.semester, s.year, s.days_of_week,
      TIME_FORMAT(s.start_time, '%h:%i %p') as start_time,
      TIME_FORMAT(s.end_time, '%h:%i %p') as end_time,
      s.location, s.section,
      s.enrolled_students, c.max_students
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN instructors i ON s.instructor_id = i.id
    WHERE c.course_code = ?
    ORDER BY s.semester DESC, s.section
  `, [courseCode]);

  if (schedules.length === 0) {
    return {
      success: false,
      response: `I couldn't find any scheduled sections for ${courseCode}. It may not be offered this semester, or the course code might be incorrect.`,
      suggestions: ["Tell me about other courses", "Show CS courses"]
    };
  }

  let response = `**${schedules[0].course_code}: ${schedules[0].course_name}**\n\n`;
  
  schedules.forEach((schedule, index) => {
    const available = schedule.max_students - schedule.enrolled_students;
    response += `📅 **Section ${schedule.section}** (${schedule.semester} ${schedule.year})
👨‍🏫 Instructor: ${schedule.instructor_name}
🕐 Time: ${schedule.days_of_week} ${schedule.start_time} - ${schedule.end_time}
📍 Location: ${schedule.location}
👥 Enrollment: ${schedule.enrolled_students}/${schedule.max_students} (${available} seats available)\n\n`;
  });

  return {
    success: true,
    response: response.trim(),
    data: schedules,
    suggestions: [
      `Tell me about ${courseCode}`,
      `Who is ${schedules[0].instructor_name}?`,
      "Show me prerequisites"
    ]
  };
}

/**
 * Handle course prerequisites intent
 */
async function handleCoursePrerequisites(entities) {
  if (!entities.course_codes || entities.course_codes.length === 0) {
    return {
      success: false,
      response: "Which course's prerequisites would you like to know about? Please provide a course code."
    };
  }

  const courseCode = entities.course_codes[0];
  
  const results = await query(
    `SELECT course_code, course_name, prerequisites FROM courses WHERE course_code = ?`,
    [courseCode]
  );

  if (results.length === 0) {
    return {
      success: false,
      response: `I couldn't find ${courseCode}. Please check the course code.`
    };
  }

  const course = results[0];

  if (!course.prerequisites) {
    return {
      success: true,
      response: `**${course.course_code}: ${course.course_name}**\n\n✅ No prerequisites required! This is an introductory course that you can take directly.`,
      data: course,
      suggestions: [
        `When is ${courseCode} offered?`,
        "Show me more introductory courses"
      ]
    };
  }

  return {
    success: true,
    response: `**${course.course_code}: ${course.course_name}**\n\n📋 **Prerequisites:** ${course.prerequisites}\n\nYou must complete these courses before enrolling in ${courseCode}.`,
    data: course,
    suggestions: [
      `Tell me about ${course.prerequisites}`,
      `When is ${courseCode} offered?`
    ]
  };
}

/**
 * Handle instructor info intent
 */
async function handleInstructorInfo(entities) {
  if (!entities.instructor_names || entities.instructor_names.length === 0) {
    return {
      success: false,
      response: "Which instructor would you like to know about? Please provide a name."
    };
  }

  const instructorName = entities.instructor_names[0];
  const nameParts = instructorName.split(' ');
  const lastName = nameParts[nameParts.length - 1];

  const results = await query(
    `SELECT * FROM instructors WHERE last_name LIKE ? OR first_name LIKE ?`,
    [`%${lastName}%`, `%${lastName}%`]
  );

  if (results.length === 0) {
    return {
      success: false,
      response: `I couldn't find an instructor matching "${instructorName}". Please check the spelling or try with just the last name.`
    };
  }

  const instructor = results[0];

  return {
    success: true,
    response: `**${instructor.first_name} ${instructor.last_name}**

🏢 **Department:** ${instructor.department}
📧 **Email:** ${instructor.email}
📍 **Office:** ${instructor.office_location}
📞 **Phone:** ${instructor.phone}
🕐 **Office Hours:** ${instructor.office_hours}`,
    data: instructor,
    suggestions: [
      "What courses does this instructor teach?",
      "Show office hours"
    ]
  };
}

/**
 * Handle instructor office hours intent
 */
async function handleInstructorOfficeHours(entities) {
  if (!entities.instructor_names || entities.instructor_names.length === 0) {
    return {
      success: false,
      response: "Whose office hours would you like to know? Please provide an instructor name."
    };
  }

  const instructorName = entities.instructor_names[0];
  const nameParts = instructorName.split(' ');
  const lastName = nameParts[nameParts.length - 1];

  const results = await query(
    `SELECT first_name, last_name, office_hours, office_location, email FROM instructors WHERE last_name LIKE ?`,
    [`%${lastName}%`]
  );

  if (results.length === 0) {
    return {
      success: false,
      response: `I couldn't find office hours for "${instructorName}".`
    };
  }

  const instructor = results[0];

  return {
    success: true,
    response: `**${instructor.first_name} ${instructor.last_name} - Office Hours**

🕐 **Hours:** ${instructor.office_hours}
📍 **Location:** ${instructor.office_location}
📧 **Email:** ${instructor.email}

You can visit during these times or email to schedule an appointment.`,
    data: instructor
  };
}

/**
 * Handle course availability intent
 */
async function handleCourseAvailability(entities) {
  if (!entities.course_codes || entities.course_codes.length === 0) {
    return {
      success: false,
      response: "Which course's availability would you like to check?"
    };
  }

  const courseCode = entities.course_codes[0];
  
  const results = await query(`
    SELECT 
      c.course_code, c.course_name, c.max_students,
      s.section, s.enrolled_students, s.semester, s.year
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    WHERE c.course_code = ?
    ORDER BY s.section
  `, [courseCode]);

  if (results.length === 0) {
    return {
      success: false,
      response: `No sections found for ${courseCode}.`
    };
  }

  let response = `**${results[0].course_code}: ${results[0].course_name}** - Seat Availability\n\n`;
  
  results.forEach(section => {
    const available = section.max_students - section.enrolled_students;
    const percentage = ((section.enrolled_students / section.max_students) * 100).toFixed(0);
    const status = available > 10 ? '✅ Open' : available > 0 ? '⚠️ Limited' : '❌ Full';
    
    response += `**Section ${section.section}** (${section.semester} ${section.year}): ${status}
   ${section.enrolled_students}/${section.max_students} enrolled (${available} seats available, ${percentage}% full)\n\n`;
  });

  return {
    success: true,
    response: response.trim(),
    data: results
  };
}

/**
 * Handle department courses intent
 */
async function handleDepartmentCourses(entities) {
  let department = null;

  if (entities.departments && entities.departments.length > 0) {
    department = entities.departments[0];
  } else {
    return {
      success: false,
      response: "Which department's courses would you like to see? (e.g., Computer Science, Mathematics, Physics)"
    };
  }

  const courses = await query(
    `SELECT course_code, course_name, credits, level FROM courses WHERE department = ? ORDER BY course_code`,
    [department]
  );

  if (courses.length === 0) {
    return {
      success: false,
      response: `I couldn't find any courses for the ${department} department. Please check the department name.`
    };
  }

  let response = `**${department} Department Courses**\n\n`;
  
  courses.forEach(course => {
    response += `• **${course.course_code}**: ${course.course_name} (${course.credits} credits, ${course.level})\n`;
  });

  return {
    success: true,
    response: response.trim(),
    data: courses,
    suggestions: courses.slice(0, 3).map(c => `Tell me about ${c.course_code}`)
  };
}

/**
 * Handle course credits intent
 */
async function handleCourseCredits(entities) {
  if (!entities.course_codes || entities.course_codes.length === 0) {
    return {
      success: false,
      response: "Which course's credit hours would you like to know?"
    };
  }

  const courseCode = entities.course_codes[0];
  
  const results = await query(
    `SELECT course_code, course_name, credits FROM courses WHERE course_code = ?`,
    [courseCode]
  );

  if (results.length === 0) {
    return { success: false, response: `Course ${courseCode} not found.` };
  }

  const course = results[0];

  return {
    success: true,
    response: `**${course.course_code}: ${course.course_name}**\n\n⭐ **Credits:** ${course.credits} credit hours`,
    data: course
  };
}

/**
 * Handle course location intent
 */
async function handleCourseLocation(entities) {
  if (!entities.course_codes || entities.course_codes.length === 0) {
    return {
      success: false,
      response: "Which course's location would you like to know?"
    };
  }

  const courseCode = entities.course_codes[0];
  
  const results = await query(`
    SELECT c.course_code, c.course_name, s.location, s.section, s.days_of_week,
           TIME_FORMAT(s.start_time, '%h:%i %p') as start_time
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    WHERE c.course_code = ?
  `, [courseCode]);

  if (results.length === 0) {
    return {
      success: false,
      response: `No location information found for ${courseCode}.`
    };
  }

  let response = `**${results[0].course_code}: ${results[0].course_name}** - Locations\n\n`;
  
  results.forEach(schedule => {
    response += `📍 **Section ${schedule.section}**: ${schedule.location}\n   ${schedule.days_of_week} at ${schedule.start_time}\n\n`;
  });

  return {
    success: true,
    response: response.trim(),
    data: results
  };
}

/**
 * Handle unknown intent
 */
async function handleUnknown(entities) {
  return {
    success: false,
    response: `I'm not sure I understood that. I can help you with:

• Course information and schedules
• Instructor details and office hours
• Prerequisites and requirements
• Course availability
• Department course listings

Could you please rephrase your question or try one of the suggestions?`,
    suggestions: [
      "What is CS101?",
      "When is Database Systems offered?",
      "Who teaches AI?",
      "Show me Math courses"
    ]
  };
}

/**
 * Handle low confidence responses
 */
async function handleLowConfidence(intent, entities) {
  return {
    success: false,
    response: `I'm not quite sure what you're asking about. Could you please provide more details or rephrase your question?

For example:
• "What is CS101?"
• "When is Data Structures offered?"
• "Who teaches Professor Smith?"
• "Show me Computer Science courses"`,
    suggestions: [
      "Show me help",
      "List available commands"
    ]
  };
}

module.exports = {
  generateResponse
};
