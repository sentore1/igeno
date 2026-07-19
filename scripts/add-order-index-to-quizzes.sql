-- Add order_index column to quizzes table for consistency with course_quizzes
-- This allows multiple quizzes per lesson to be ordered properly

-- Add the order_index column
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add description column (exists in course_quizzes but not in quizzes)
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add time_limit_minutes column (exists in course_quizzes but not in quizzes)
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER;

-- Add is_required column (exists in course_quizzes but not in quizzes)
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false;

-- Add max_attempts column (exists in course_quizzes but not in quizzes)
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 3;

-- Update existing quizzes to have order_index = 0
UPDATE public.quizzes 
SET order_index = 0 
WHERE order_index IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON public.quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_order ON public.quizzes(lesson_id, order_index);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'quizzes' 
AND table_schema = 'public'
ORDER BY ordinal_position;
