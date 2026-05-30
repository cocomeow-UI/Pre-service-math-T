export interface EvaluationRequest {
  achievementStandard: string;
  studentUtterance: string;
  context: string;
  exemplarAnswer: string;
  userAnswer: string;
}

export interface EvaluationResponse {
  scores: {
    curriculum: number; // 0-100
    eyeLevel: number;   // 0-100
    flow: number;       // 0-100
  };
  strengths: string[];
  improvements: string[];
  isDemo?: boolean;
}

/**
 * Sends the teacher's correction response to the backend GPT-evaluation endpoint.
 * @param payload The scenario data and user answer.
 * @returns A promise resolving to the evaluation results.
 */
export async function evaluateAnswer(payload: EvaluationRequest): Promise<EvaluationResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server returned error status: ${response.status}`);
  }

  return response.json();
}
