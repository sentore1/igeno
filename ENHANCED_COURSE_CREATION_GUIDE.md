# Enhanced Course Creation Guide

## Overview

The course creation system has been significantly enhanced to support a richer learning experience. You can now add:

- **YouTube videos** and other video links
- **PDF documents** and other downloadable resources
- **External links** to additional learning materials
- **Interactive quizzes** with multiple-choice questions
- **Learning outcomes** to set clear expectations
- **Prerequisites** to guide student preparation

## Database Setup

### Step 1: Run the Enhancement Script

Before using the new features, you need to update your database schema:

1. Open your Supabase SQL Editor
2. Copy and run the script: `scripts/enhance-course-structure.sql`

This will:
- Add new columns to the `courses` table (`youtube_url`, `prerequisites`, `learning_outcomes`)
- Create the `course_resources` table for PDFs, videos, and links
- Create the `course_quizzes` table for assessments
- Create the `course_quiz_attempts` table to track student performance
- Set up proper Row Level Security (RLS) policies
- Create a storage bucket for file uploads

### Step 2: Verify Installation

Check that these new tables exist in your database:
- `course_resources`
- `course_quizzes`
- `course_quiz_attempts`

## Using the Enhanced Course Creator

### Creating a New Course

1. Navigate to **Admin Dashboard → Course Management**
2. Click **"Create Course"** button
3. You'll see three tabs: **Course Details**, **Resources**, and **Quizzes**

---

## Tab 1: Course Details

### Basic Information

**Required Fields:**
- **Title**: The name of your course
- **Description**: What students will learn (be detailed!)
- **Category**: Choose from predefined categories
- **Duration (hours)**: Estimated time to complete

### Enhanced Fields

**YouTube URL** (Optional)
- Add a course introduction or overview video
- Supports YouTube and other video platforms
- Example: `https://youtube.com/watch?v=abc123`

**Prerequisites** (Optional)
- Describe what students should know beforehand
- Example: "Basic computer skills and familiarity with healthcare terminology"

**Learning Outcomes**
- Click "Add" to include multiple learning outcomes
- Be specific about what students will achieve
- Examples:
  - "Understand basic patient care techniques"
  - "Demonstrate proper lifting and mobility assistance"
  - "Recognize signs of common health emergencies"

**Publish Settings**
- Check "Publish immediately" to make the course visible right away
- Leave unchecked to save as a draft

---

## Tab 2: Resources

Add supplementary materials for your course.

### Resource Types

1. **PDF Document**
   - Course syllabus, handouts, guides
   - Provide direct link to PDF file

2. **Video (YouTube/Vimeo)**
   - Tutorial videos, demonstrations
   - Paste the video URL

3. **External Link**
   - Articles, websites, online tools
   - Any HTTP/HTTPS link

4. **Document**
   - Word docs, presentations, spreadsheets
   - Provide link to the document

5. **Other**
   - Any other type of resource

### Adding a Resource

1. Enter **Resource Title** (e.g., "Course Syllabus", "Week 1 Video")
2. Select **Resource Type** from dropdown
3. Enter **Resource URL**
   - For PDFs: Direct link to the PDF file
   - For videos: YouTube, Vimeo, or other video URLs
   - For links: Any webpage URL
4. Add optional **Description**
5. Check **"Allow students to download"** if applicable
6. Click **"Add Resource"**

### Resource Examples

```
Title: Course Introduction Video
Type: Video
URL: https://youtube.com/watch?v=abc123
Description: Welcome video and course overview
Downloadable: No

Title: Caregiver Handbook
Type: PDF
URL: https://your-site.com/files/handbook.pdf
Description: Complete reference guide for caregivers
Downloadable: Yes

Title: CDC Guidelines
Type: External Link
URL: https://cdc.gov/caregiving
Description: Official CDC caregiving resources
Downloadable: No
```

### Managing Resources

- Resources are listed below the form after adding
- Click **"Remove"** to delete a resource
- Resources will be saved when you submit the course

---

## Tab 3: Quizzes

Create assessments to test student knowledge.

### Quiz Settings

**Quiz Information:**
- **Title**: Name of the quiz (e.g., "Module 1 Assessment")
- **Description**: What the quiz covers

**Configuration:**
- **Passing Score (%)**: Minimum score to pass (default: 70%)
- **Time Limit (minutes)**: How long students have to complete (default: 30 min)
- **Max Attempts**: Number of tries allowed (default: 3)
- **Required for completion**: Check if students must pass to complete the course

### Adding Questions

For each question:

1. **Enter Question Text**
   - Be clear and specific
   - Example: "What is the proper way to assist a patient with limited mobility?"

2. **Add 4 Answer Options**
   - Fill in all four option fields
   - Make answers plausible but distinguishable

3. **Select Correct Answer**
   - Click the radio button next to the correct option

4. **Click "Add Question"**
   - Question is added to the current quiz
   - You can add multiple questions

### Quiz Example

```
Quiz Title: Basic Caregiving Assessment
Description: Test your knowledge of fundamental caregiving principles
Passing Score: 75%
Time Limit: 20 minutes
Max Attempts: 2
Required: Yes

Question 1: What should you do before lifting a patient?
  ○ Option 1: Lift quickly to avoid strain
  ● Option 2: Assess the patient's weight and get assistance if needed (CORRECT)
  ○ Option 3: Wait for the patient to ask
  ○ Option 4: Use only one hand

Question 2: How often should you wash your hands when providing care?
  ● Option 1: Before and after each patient interaction (CORRECT)
  ○ Option 2: Once per day
  ○ Option 3: Only when visibly dirty
  ○ Option 4: Every hour
```

### Managing Quizzes

- Added questions appear below the question builder
- Click **"Remove"** on a question to delete it
- Click **"Save Quiz"** when all questions are added
- Saved quizzes appear in the "Added Quizzes" section
- You can create multiple quizzes per course

---

## Submitting the Course

1. Complete all three tabs as needed
2. Return to **Course Details** tab (or any tab)
3. Click **"Create Course"** at the bottom
4. The system will save:
   - Course information
   - All resources
   - All quizzes with their questions
5. Success! You'll see a confirmation message

---

## Tips and Best Practices

### Course Details
- Write clear, engaging descriptions
- Use bullet points for learning outcomes
- Be realistic about duration estimates
- Add prerequisites to set proper expectations

### Resources
- **Organize by topic**: Name resources clearly (e.g., "Week 1 - Introduction")
- **Mix media types**: Combine videos, PDFs, and links for variety
- **Check links**: Ensure all URLs work before submitting
- **Use quality sources**: Link to authoritative, professional resources
- **Consider accessibility**: Provide transcripts for videos when possible

### Quizzes
- **Start simple**: 5-10 questions per quiz is usually sufficient
- **Test understanding, not memorization**: Focus on application
- **Vary difficulty**: Mix easy, medium, and hard questions
- **Provide context**: Use real-world scenarios in questions
- **Review carefully**: Check that correct answers are actually correct!
- **Fair time limits**: Allow 1-2 minutes per question
- **Allow retakes**: Students learn by trying again (2-3 attempts recommended)

---

## Technical Notes

### Storage
- Course files are stored in Supabase Storage bucket: `course-files`
- Resources are linked by URL (not uploaded directly in this version)
- For future file uploads, you can extend the system to use Supabase Storage

### Database Structure

**course_resources** table:
- Links resources to courses
- Stores resource metadata (title, type, URL)
- Ordered by `order_index`

**course_quizzes** table:
- Links quizzes to courses
- Stores quiz settings
- Questions stored as JSONB array

**course_quiz_attempts** table:
- Tracks student quiz submissions
- Records scores and pass/fail status
- Useful for analytics

### Security
- Admins and course instructors can manage all course content
- Students can view published course materials
- RLS policies enforce proper access control

---

## Troubleshooting

### "Failed to create course"
- Check that you've run the database enhancement script
- Verify all required fields are filled in
- Check browser console for specific errors

### Resources not saving
- Verify URLs are valid (start with http:// or https://)
- Check that resource title is not empty
- Ensure database has `course_resources` table

### Quizzes not saving
- Make sure quiz has at least one question
- Verify all answer options are filled in
- Check that a correct answer is selected

---

## Future Enhancements

Potential additions for version 2:
- Direct file upload for PDFs and documents
- Video embedding and playback
- Quiz question types: true/false, fill-in-blank, matching
- Image support in quiz questions
- Automatic certificate generation upon course completion
- Course progress tracking
- Discussion forums per course

---

## Support

For questions or issues:
1. Check this guide first
2. Review the database schema in `scripts/enhance-course-structure.sql`
3. Check the component code in `components/EnhancedCourseForm.tsx`
4. Verify your Supabase setup and RLS policies

Happy course creating! 🎓
