# Lesson Quiz Display Fix

## Problem
When viewing a lesson in the learning interface (`/academy/courses/[id]/learn`), only **Course Quizzes** were being displayed. Lesson-specific quizzes (like "gerg" attached to Lesson 1) were not visible at all.

## Root Cause
The page was only fetching and displaying course-level quizzes from the `course_quizzes` table, but **not fetching lesson-level quizzes** from the `quizzes` table.

### Database Structure
There are two separate quiz tables:
1. **`quizzes`** - Lesson-level quizzes (linked to `lesson_id`)
2. **`course_quizzes`** - Course-level quizzes (linked to `course_id`)

## Solution
Updated `app/academy/courses/[id]/learn/page.tsx` to:

1. **Added state for lesson quizzes:**
   ```typescript
   const [lessonQuizzes, setLessonQuizzes] = useState<any[]>([]);
   ```

2. **Fetch lesson quizzes when lesson changes:**
   ```typescript
   useEffect(() => {
     if (!activeLesson) return;
     Promise.all([
       supabase.from('resources').select('*').eq('lesson_id', activeLesson.id),
       supabase.from('quizzes').select('*').eq('lesson_id', activeLesson.id).order('order_index', { ascending: true })
     ]).then(([resourcesRes, quizzesRes]) => {
       setResources(resourcesRes.data || []);
       setLessonQuizzes(quizzesRes.data || []);
     });
   }, [activeLesson]);
   ```

3. **Added UI section to display lesson quizzes:**
   - Shows after lesson content and lesson resources
   - Shows before course resources and course quizzes
   - Uses the same quiz interface (Take Quiz button, score display, etc.)

## Display Order
Now when viewing a lesson, sections appear in this order:
1. Lesson Video (if available)
2. Lesson Content
3. **Lesson Resources** (specific to this lesson)
4. **Lesson Quizzes** (specific to this lesson) ← **NEWLY ADDED**
5. Course Resources (available for all lessons)
6. Course Quizzes (available for all lessons)

## Testing
After this fix:
- Navigate to any lesson that has a quiz attached
- You should now see a "Lesson Quizzes" section
- Example: Lesson 1 "fef" should display the "gerg" quiz
- Clicking "Take Quiz" will open the quiz interface

## Files Modified
- `app/academy/courses/[id]/learn/page.tsx`
