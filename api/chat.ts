import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(451).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { achievementStandard, studentUtterance, context, exemplarAnswer, userAnswer } = req.body || {};

    if (!achievementStandard || !studentUtterance || !userAnswer) {
      return res.status(400).json({
        error: 'Missing required parameters: achievementStandard, studentUtterance, and userAnswer are required.',
      });
    }

    const rawApiKey = process.env.OPENAI_API_KEY?.trim();
    const apiKey =
      rawApiKey && !['undefined', 'null'].includes(rawApiKey.toLowerCase())
        ? rawApiKey
        : undefined;

    // Fallback: If no API key is provided, generate a simulated feedback for local testing
    if (!apiKey) {
      console.warn('OpenAI API Key is missing. Returning a simulated feedback for demonstration.');
      
      // Simulate evaluation scores based on user answer length and content presence
      const userLen = userAnswer.length;
      let curriculumScore = Math.min(100, Math.max(40, 50 + Math.floor(userLen / 5)));
      let eyeLevelScore = Math.min(100, Math.max(40, 55 + Math.floor(userLen / 6)));
      let flowScore = Math.min(100, Math.max(40, 45 + Math.floor(userLen / 4)));

      // Adjust scores if they mention specific elements
      const hasGreeting = userAnswer.includes('안녕') || userAnswer.includes('맞아') || userAnswer.includes('생각') || userAnswer.includes('그럴 수');
      if (hasGreeting) {
        flowScore = Math.min(100, flowScore + 15);
      }

      const hasExample = userAnswer.includes('예를') || userAnswer.includes('예시') || userAnswer.includes('실제') || userAnswer.includes('숫자');
      if (hasExample) {
        eyeLevelScore = Math.min(100, eyeLevelScore + 10);
      }

      // Predefined template fallback
      return res.status(200).json({
        isDemo: true,
        scores: {
          curriculum: curriculumScore,
          eyeLevel: eyeLevelScore,
          flow: flowScore,
        },
        strengths: [
          '학생의 오개념 원인을 수학적 정의를 통해 정확하게 짚어내기 위해 고민한 흔적이 보입니다.',
          userAnswer.length > 50 
            ? '답변에 충분한 양의 설명이 담겨 있어 학생들이 단계적으로 논리를 따라올 수 있도록 배려했습니다.' 
            : '핵심 설명 위주로 간결하게 구성을 요약했습니다.'
        ],
        improvements: [
          '**[안내]** 현재 `.env.local`에 `OPENAI_API_KEY`가 설정되지 않아 임시 평가 결과가 생성되었습니다. 실시간 AI 피드백을 원하시면 API Key를 연동해 주세요.',
          '학생의 눈높이에 맞춰 친숙한 예시(예: 실제 숫자 계산이나 시각적 그림 등)를 조금 더 곁들이면 훨씬 알기 쉬운 설명이 됩니다.',
          '학생의 오개념(발화내용)을 즉각 틀렸다고 지적하기보다, 왜 그렇게 착각했는지 학생의 입장에서 먼저 공감해 주면 정서적 학습 효과가 높아집니다.'
        ]
      });
    }

    // Call OpenAI API
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
          { role: 'user', content: buildUserPrompt({
              achievementStandard,
              studentUtterance,
              context: context || '',
              exemplarAnswer: exemplarAnswer || '',
              userAnswer,
            }) 
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
    } catch (parseError) {
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
