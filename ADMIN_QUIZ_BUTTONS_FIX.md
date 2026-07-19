# Admin Quiz Buttons Fix

## Problems Found

1. **"Add Quiz" button in Quizzes tab** - Only showed an alert message saying to use the "Create Course" modal
2. **"Add Quiz" button next to lessons** - Was already implemented but not working for course-level quizzes
3. **Quiz disappeared** - The quiz "dfdf" that was added earlier disappeared (likely a data format issue)

## Solution Implemented

### 1. Added Course Quiz Functionality

**New State Variable:**
```typescript
const [showAddCourseQuiz, setShowAddCourseQuiz] = useState(false);
```

**New Function `addCourseQuiz`:**
- Transforms quiz questions from QuizBuilder format to database format
- Saves to `course_quizzes` table instead of `quizzes` table
- Formats questions with `correct_answer` field (stores the actual answer text)
- Sets default values for time limit (30 min), max attempts (3), and required status (false)

**Button Updated:**
Changed the "Add Quiz" button in the Quizzes tab from showing an alert to:
```typescript
onClick={() => setShowAddCourseQuiz(true)}
```

### 2. Added Course Quiz Modal

Added the QuizBuilder modal for course quizzes at the end of the component:
```typescript
{showAddCourseQuiz && (
  <QuizBuilder
    onSubmit={addCourseQuiz}
    onCancel={() => setShowAddCourseQuiz(false)}
  />
)}
```

## Key Differences

### Course Quizzes vs Lesson Quizzes

| Feature | Course Quizzes | Lesson Quizzes |
|---------|---------------|----------------|
| Table | `course_quizzes` | `quizzes` |
| Scope | Entire course | Single lesson |
| Foreign Key | `course_id` | `lesson_id` |
| Visible When | On all lessons (in learning page) | Only on specific lesson |
| Button Location | Quizzes tab | Next to each lesson |
| Data Format | `correct_answer` (text) | `correct` (index) |

### Quiz Data Format

**QuizBuilder Output:**
```json
{
  "question": "What is...?",
  "options": ["Option A", "Option B", "Option C"],
  "correct": 1  // Index of correct answer
}
```

**Course Quiz Storage:**
```json
{
  "question": "What is...?",
  "options": ["Option A", "Option B", "Option C"],
  "correct_answer": "Option B"  // Actual answer text
}
```

## How It Works Now

### Admin Panel - Quizzes Tab:
1. Click green "Add Quiz" button
2. QuizBuilder modal opens
3. Enter quiz title and passing score
4. Add questions with multiple choice options
5. Select correct answer for each question
6. Click "Create Quiz"
7. Quiz saves to `course_quizzes` table
8. Quiz appears in the Quizzes tab list
9. Quiz becomes visible to users in the learning page

### Admin Panel - Lessons Tab:
1. Click green "Add Quiz" button next to a lesson
2. QuizBuilder modal opens
3. Same process as above
4. Quiz saves to `quizzes` table (lesson-specific)
5. Quiz appears only for that specific lesson

## Testing Steps

1. **Go to admin course page:** `/dashboard/admin/courses/[course-id]`
2. **Click "Quizzes" tab**
3. **Click green "Add Quiz" button**
4. **Fill in quiz details:**
   - Quiz title: "Test Quiz"
   - Passing score: 70%
   - Add 2-3 questions with multiple options
   - Mark correct answers
5. **Click "Create Quiz"**
6. **Verify:** Quiz appears in the Quizzes (1) tab
7. **Go to user learning page:** `/academy/courses/[course-id]/learn`
8. **Verify:** Quiz appears in "Course Quizzes" section
9. **Click "Take Quiz"**
10. **Verify:** Quiz interface loads with questions

## Files Modified

- `/app/dashboard/admin/courses/[id]/page.tsx` - Added course quiz functionality

## Database Requirements

Ensure `course_quizzes` table has these columns:
- `id` (uuid, primary key)
- `course_id` (uuid, foreign key to courses)
- `title` (text)
- `description` (text, nullable)
- `questions` (jsonb) - Array of questions with correct_answer
- `passing_score` (integer)
- `time_limit_minutes` (integer)
- `max_attempts` (integer)
- `is_required` (boolean)
- `order_index` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)
