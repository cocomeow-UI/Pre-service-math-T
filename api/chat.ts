import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';

type EvaluationResult = {
  isDemo?: boolean;
  scores: {
    curriculum: number;
    eyeLevel: number;
    flow: number;
  };
  strengths: string[];
  improvements: string[];
};

function hasUsableApiKey(value: string | undefined) {
  const key = value?.trim();
  return !!key && !['undefined', 'null'].includes(key.toLowerCase());
}

function buildDemoEvaluation(userAnswer: string): EvaluationResult {
  const answer = String(userAnswer).trim();
  const meaningfulChars = answer.replace(/[\sㅋㅎㅠㅜ.,!?~…'"]/g, '');
  const hasMathTerm = /제곱|근호|루트|방정식|함수|인수분해|전개|부호|그래프|꼭짓점|해|x|y|π|√|\d/.test(answer);
  const acknowledgesStudent = /맞아|그렇게 생각|헷갈|좋은 질문|이해|먼저|생각할 수/.test(answer);
  const hasCorrection = /하지만|그런데|다만|아니라|왜냐하면|따라서|그래서/.test(answer);
  const hasExample = /예를 들|예시|대입|확인|보면|예를/.test(answer) || /\d/.test(answer);
  const isTooShort = meaningfulChars.length < 12;

  if (isTooShort || !hasMathTerm) {
    return {
      isDemo: true,
      scores: {
        curriculum: isTooShort ? 5 : 15,
        eyeLevel: acknowledgesStudent ? 20 : 5,
        flow: hasCorrection ? 20 : 5,
      },
      strengths: ['아직 평가할 수 있는 수학적 설명이 충분히 드러나지 않았습니다.'],
      improvements: [
        '학생의 오개념이 무엇인지 먼저 짚고, 올바른 개념을 한두 문장 이상으로 설명해 주세요.',
        '수학 용어, 간단한 예시, 학생의 생각을 인정하는 표현이 포함되면 더 정확하게 평가할 수 있습니다.',
      ],
    };
  }

  const lengthScore = Math.min(30, Math.floor(meaningfulChars.length / 4));
  const curriculum = Math.min(100, 30 + lengthScore + (hasMathTerm ? 25 : 0) + (hasCorrection ? 15 : 0));
  const eyeLevel = Math.min(100, 25 + lengthScore + (acknowledgesStudent ? 20 : 0) + (hasExample ? 20 : 0));
  const flow = Math.min(100, 25 + lengthScore + (acknowledgesStudent ? 15 : 0) + (hasCorrection ? 20 : 0));

  return {
    isDemo: true,
    scores: {
      curriculum,
      eyeLevel,
      flow,
    },
    strengths: [
      '학생의 답변에 반응하며 수학적 설명을 구성하려는 시도가 보입니다.',
      hasExample
        ? '간단한 예시나 대입을 활용해 학생이 확인할 수 있는 설명을 포함했습니다.'
        : '핵심 개념을 중심으로 답변을 구성했습니다.',
    ],
    improvements: [
      '**[안내]** 현재 `.env.local`에 `OPENAI_API_KEY`가 설정되지 않아 임시 평가 결과가 생성되었습니다.',
      '학생의 오개념을 먼저 인정한 뒤, 왜 기존 생각이 성립하지 않는지 단계적으로 연결하면 더 좋습니다.',
      '숫자 대입이나 짧은 반례를 추가하면 학생 눈높이에 더 맞는 설명이 됩니다.',
    ],
  };
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
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { achievementStandard, studentUtterance, context, exemplarAnswer, userAnswer } = req.body || {};

    if (!achievementStandard || !studentUtterance || !userAnswer) {
      return res.status(400).json({
        error: 'Missing required parameters: achievementStandard, studentUtterance, and userAnswer are required.',
      });
    }

    const apiKey = hasUsableApiKey(process.env.OPENAI_API_KEY)
      ? process.env.OPENAI_API_KEY!.trim()
      : undefined;

    if (!apiKey) {
      return res.status(200).json(buildDemoEvaluation(userAnswer));
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      const errData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', errData);
      return res.status(response.status).json({
        error: 'Error calling OpenAI API',
        details: errData,
      });
    }

    const data = (await response.json()) as any;
    const resultString = data.choices?.[0]?.message?.content;

    if (!resultString) {
      return res.status(500).json({ error: 'Failed to retrieve response content from OpenAI.' });
    }

    try {
      const evaluation = JSON.parse(resultString.trim());
      return res.status(200).json(evaluation);
    } catch {
      console.error('Failed to parse OpenAI JSON output:', resultString);
      return res.status(500).json({
        error: 'OpenAI returned an invalid JSON schema.',
        raw: resultString,
      });
    }
  } catch (error: any) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
