type EvaluationResult = {
  scores: {
    curriculum: number;
    eyeLevel: number;
    flow: number;
  };
  strengths: string[];
  improvements: string[];
};

const SYSTEM_PROMPT = `
You are an expert mathematics education evaluator for pre-service middle-school math teachers.

Evaluate the teacher answer to a student's mathematical misconception.

Score each criterion from 0 to 100:

1. curriculum
- Mathematical correctness and alignment with the achievement standard.
- No new misconceptions.
- Appropriate middle-school mathematical language.

2. eyeLevel
- Understandable to a first-time middle-school learner.
- Avoids unnecessary advanced terminology or formal proof.
- Uses an accessible example, substitution, comparison, or check when useful.

3. flow
- Acknowledges why the student may think that way.
- Connects the misconception to the correct concept.
- Organized and step-by-step.

Very short, joking, meaningless, or non-mathematical answers must receive very low scores.
Return Korean feedback.
Return only valid JSON with this exact shape:

{
  "scores": {
    "curriculum": 0,
    "eyeLevel": 0,
    "flow": 0
  },
  "strengths": ["..."],
  "improvements": ["..."]
}
`;

function buildUserPrompt(input: {
  achievementStandard: string;
  studentUtterance: string;
  context: string;
  exemplarAnswer: string;
  userAnswer: string;
}) {
  return `
[Evaluation target]
- Achievement standard: ${input.achievementStandard}
- Student utterance: "${input.studentUtterance}"
- Misconception context: ${input.context}
- Reference model answer: ${input.exemplarAnswer}
- Teacher answer to evaluate: "${input.userAnswer}"

Evaluate only the teacher answer. Return valid JSON only.
`;
}

function getApiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || ['undefined', 'null'].includes(key.toLowerCase())) {
    return null;
  }
  return key;
}

function parseEvaluation(content: string): EvaluationResult {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned);
  const scores = parsed?.scores;

  if (
    typeof scores?.curriculum !== 'number' ||
    typeof scores?.eyeLevel !== 'number' ||
    typeof scores?.flow !== 'number' ||
    !Array.isArray(parsed?.strengths) ||
    !Array.isArray(parsed?.improvements)
  ) {
    throw new Error('OpenAI returned JSON, but it did not match the expected evaluation schema.');
  }

  return {
    scores: {
      curriculum: Math.max(0, Math.min(100, Math.round(scores.curriculum))),
      eyeLevel: Math.max(0, Math.min(100, Math.round(scores.eyeLevel))),
      flow: Math.max(0, Math.min(100, Math.round(scores.flow))),
    },
    strengths: parsed.strengths.map(String),
    improvements: parsed.improvements.map(String),
  };
}

function sendJson(res: any, status: number, data: unknown) {
  return res.status(status).json(data);
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    );
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'POST 요청만 사용할 수 있습니다.' });
  }

  const { achievementStandard, studentUtterance, context, exemplarAnswer, userAnswer } = req.body || {};

  if (!achievementStandard || !studentUtterance || !userAnswer) {
    return sendJson(res, 400, {
      error: '평가에 필요한 데이터가 부족합니다.',
    });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'OPENAI_API_KEY 환경변수가 배포 환경에 설정되어 있지 않습니다.',
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildUserPrompt({
              achievementStandard,
              studentUtterance,
              context: context || '',
              exemplarAnswer: exemplarAnswer || '',
              userAnswer,
            }),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errData = (await response.json().catch(() => ({}))) as any;
      const message = errData?.error?.message || `OpenAI API 요청이 실패했습니다. status=${response.status}`;
      console.error('OpenAI API Error:', errData);
      return sendJson(res, 502, {
        error: message,
        status: response.status,
      });
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return sendJson(res, 502, {
        error: 'OpenAI 응답에 평가 내용이 없습니다.',
      });
    }

    return sendJson(res, 200, parseEvaluation(content));
  } catch (error: any) {
    console.error('Evaluation API Error:', error);
    return sendJson(res, 500, {
      error: error?.message || '평가 API 실행 중 오류가 발생했습니다.',
    });
  }
}
