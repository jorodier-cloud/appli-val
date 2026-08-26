export interface MathQuestionEval {
  question_number: string;
  question_confidence: number; // 0.0 à 1.0
  transcribed_latex: string;
  has_crossed_out_content: boolean;
  crossed_out_summary?: string | null;
  error_classification:
    | "NONE"
    | "CALCULATION_ERROR"
    | "REASONING_ERROR"
    | "SYNTAX_LATEX_ERROR"
    | "MISSING_UNIT_OR_JUSTIFICATION";
  points_awarded: number;
  max_points: number;
  step_by_step_feedback: string[];
}

export interface CopyCorrectionResult {
  is_readable: boolean;
  global_confidence: number;
  student_name?: string | null;
  questions: MathQuestionEval[];
  total_score: number;
  max_total_score: number;
  teacher_summary_comment: string;
}
