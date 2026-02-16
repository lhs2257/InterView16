-- Add missing JSONB columns
ALTER TABLE feedback_reports 
ADD COLUMN IF NOT EXISTS competency_scores JSONB,
ADD COLUMN IF NOT EXISTS mbti_analysis JSONB,
ADD COLUMN IF NOT EXISTS question_feedback JSONB;

-- Make existing columns nullable if they are replaced by new JSONB columns
ALTER TABLE feedback_reports ALTER COLUMN mbti_comment DROP NOT NULL;
ALTER TABLE feedback_reports ALTER COLUMN job_fit_score DROP NOT NULL;
ALTER TABLE feedback_reports ALTER COLUMN logic_score DROP NOT NULL;
ALTER TABLE feedback_reports ALTER COLUMN confidence_score DROP NOT NULL;
ALTER TABLE feedback_reports ALTER COLUMN attitude_score DROP NOT NULL;
ALTER TABLE feedback_reports ALTER COLUMN problem_solving_score DROP NOT NULL;
