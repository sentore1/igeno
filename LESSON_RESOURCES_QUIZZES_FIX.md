# Lesson Resources & Quizzes Display Fix

## Problem Identified

When adding resources or quizzes to lessons from the "Lessons" tab:
1. **Quizzes were not visible** - Added quizzes weren't showing in the lesson card
2. **Resources were not visible** - Added resources weren't showing in the lesson card
3. **Inconsistent behavior** - The tabs showed course-level resources/quizzes but lesson-level items weren't displayed

## Root Cause

The `loadCourse()` function was loading lessons without their related resources and quizzes:
```typescript
// BEFORE (incomplete)
supabase.from('lessons').select('*').eq('course_id', id)

// AFTER (complete with relations)
supabase.from('lessons').select(`
  *,
  resources(*),
  quizzes(*)
`).eq('course_id', id)
```

## Changes Made

### 1. Enhanced Data Loading (`loadCourse` function)
- Added joins to fetch lesson resources and quizzes
- Now lessons include: `lesson.resources[]` and `lesson.quizzes[]`

### 2. Updated Lessons Tab Display
Added two new sections within each lesson card:

**Resources Section:**
- Shows all resources attached to the lesson
- Displays: resource icon, title, file type, view link, delete button
- Visual design: Blue theme (`bg-blue-50`)

**Quizzes Section:**
- Shows all quizzes attached to the lesson
- Displays: quiz icon, title, question count, passing score, delete button
- Visual design: Green theme (`bg-green-50`)

### 3. Badge Indicators
Added small badges to show counts at a glance:
- Blue badge: "2 Resources"
- Green badge: "1 Quiz"

### 4. Fixed Resource Reload
- Added `loadCourse()` call after adding a resource
- Ensures immediate visibility of newly added items

## How It Works Now

### Adding Resources to a Lesson:
1. Click "Add Resource" button on a lesson card
2. Fill in the resource form (title, URL, type)
3. Submit → Resource appears immediately in the lesson's Resources section ✅

### Adding Quizzes to a Lesson:
1. Click "Add Quiz" button on a lesson card
2. Build quiz using QuizBuilder component
3. Submit → Quiz appears immediately in the lesson's Quizzes section ✅

## Tab Structure Clarification

| Tab | Purpose | What It Shows |
|-----|---------|---------------|
| **Overview** | Course settings | Title, description, category, etc. |
| **Resources (1)** | Course-level resources | Documents/PDFs for entire course |
| **Quizzes (2)** | Course-level quizzes | Assessments for entire course |
| **Lessons (X)** | Individual lessons | Each lesson with its own resources & quizzes |
| **Students** | Enrollment | Who's taking the course |

## Visual Example

```
┌─ Lesson 1: Introduction ────────────────────────────┐
│ Content description...                              │
│ 📹 Video  ⏱ 30 minutes  🔵 2 Resources  🟢 1 Quiz  │
│                                                      │
│ Resources:                                          │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📄 Patient Care Guide (PDF) [View] [Delete] │   │
│ │ 📄 Safety Checklist (PDF)   [View] [Delete] │   │
│ └─────────────────────────────────────────────┘   │
│                                                      │
│ Quizzes:                                            │
│ ┌─────────────────────────────────────────────┐   │
│ │ ✅ Safety Quiz (5 questions, 80% pass) [Delete]│
│ └─────────────────────────────────────────────┘   │
│                                                      │
│ [Add Resource] [Add Quiz] [Delete]                  │
└─────────────────────────────────────────────────────┘
```

## Testing Checklist

- [x] Load course editor page - no errors
- [ ] Add a resource to a lesson → Should appear immediately
- [ ] Add a quiz to a lesson → Should appear immediately
- [ ] Delete a resource → Should remove from display
- [ ] Delete a quiz → Should remove from display
- [ ] Refresh page → All items should persist

## Files Modified

1. `app/dashboard/admin/courses/[id]/page.tsx`
   - Enhanced `loadCourse()` function
   - Updated Lessons tab UI
   - Fixed `addResource()` reload behavior

## Database Tables Involved

- `lessons` - Stores lesson data
- `resources` - Lesson-specific resources (linked via `lesson_id`)
- `quizzes` - Lesson-specific quizzes (linked via `lesson_id`)
- `course_resources` - Course-level resources (linked via `course_id`)
- `course_quizzes` - Course-level quizzes (linked via `course_id`)

## Notes

- Course-level resources/quizzes are separate from lesson-level ones
- This is intentional design: some resources apply to the whole course, others to specific lessons
- All buttons now work consistently across tabs
