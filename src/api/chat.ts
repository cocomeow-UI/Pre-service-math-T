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

function buildClientFallback(payload: EvaluationRequest, reason: string): EvaluationResponse {
  const answer = payload.userAnswer.trim();
  const meaningfulChars = answer.replace(/[\s.,!?~'"()\[\]{}<>:;|\\/_+=*-]/g, '');
  const isTooShort = meaningfulChars.length < 12;

  if (isTooShort) {
    return {
      isDemo: true,
      scores: {
        curriculum: 5,
        eyeLevel: 5,
        flow: 5,
      },
      strengths: ['평가할 수 있는 수학적 설명이 아직 충분히 드러나지 않았습니다.'],
      improvements: [
        '학생의 오개념을 먼저 짚고, 올바른 개념을 한두 문장 이상으로 설명해 주세요.',
        `임시 평가 안내: ${reason}`,
      ],
    };
  }

  const lengthScore = Math.min(30, Math.floor(meaningfulChars.length / 4));
  return {
    isDemo: true,
    scores: {
      curriculum: Math.min(100, 45 + lengthScore),
      eyeLevel: Math.min(100, 40 + lengthScore),
      flow: Math.min(100, 40 + lengthScore),
    },
    strengths: ['학생의 답변에 대해 설명을 구성하려는 시도가 보입니다.'],
    improvements: [
      '학생이 왜 그렇게 생각했는지 먼저 인정하고, 간단한 예시나 대입으로 확인시켜 주면 더 좋습니다.',
      `임시 평가 안내: ${reason}`,
    ],
  };
}

/**
 * Sends the teacher's correction response to the backend GPT-evaluation endpoint.
 * @param payload The scenario data and user answer.
 * @returns A promise resolving to the evaluation results.
 */
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
    return buildClientFallback(payload, '배포 서버의 평가 API에 연결하지 못해 브라우저에서 임시 평가를 생성했습니다.');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    return buildClientFallback(
      payload,
      errorBody.error || `서버가 ${response.status} 상태를 반환해 브라우저에서 임시 평가를 생성했습니다.`,
    );
  }

  try {
    return await response.json();
  } catch {
    return buildClientFallback(payload, '서버 응답을 읽지 못해 브라우저에서 임시 평가를 생성했습니다.');
  }
}
