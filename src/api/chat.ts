export interface EvaluationRequest {
  achievementStandard: string;
  studentUtterance: string;
  context: string;
  exemplarAnswer: string;
  userAnswer: string;
}

export interface EvaluationResponse {
  scores: {
    curriculum: number;
    eyeLevel: number;
    flow: number;
  };
  strengths: string[];
  improvements: string[];
  isDemo?: boolean;
}

export async function evaluateAnswer(payload: EvaluationRequest): Promise<EvaluationResponse> {
  let response: Response;

  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('평가 서버에 연결하지 못했습니다. 배포 상태와 네트워크를 확인해 주세요.');
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || `평가 서버 오류가 발생했습니다. status=${response.status}`);
  }

  if (!body?.scores || !Array.isArray(body.strengths) || !Array.isArray(body.improvements)) {
    throw new Error('평가 서버 응답 형식이 올바르지 않습니다.');
  }

  return body;
}
