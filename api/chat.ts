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
  return Boolean(key) && !['undefined', 'null'].includes(key!.toLowerCase());
}

function buildDemoEvaluation(userAnswer: string, reason?: string): EvaluationResult {
  const answer = String(userAnswer).trim();
  const meaningfulChars = answer.replace(/[\s.,!?~'"()\[\]{}<>:;|\\/_+=*-]/g, '');
  const hasMathTerm = /square|root|sqrt|equation|function|factor|expand|sign|graph|vertex|solution|answer|x|y|\d|\u221a|\u00b2|\u03c0/i.test(answer);
  const acknowledgesStudent = /yes|right|good question|understand|confus|think|first|student|can see/i.test(answer);
  const hasCorrection = /but|however|because|therefore|so|not|instead|actually/i.test(answer);
  const hasExample = /example|substitute|plug|check|for instance|when|if|\d/i.test(answer);
  const isTooShort = meaningfulChars.length < 12;

  if (isTooShort || !hasMathTerm) {
    return {
      isDemo: true,
      scores: {
        curriculum: isTooShort ? 5 : 15,
        eyeLevel: acknowledgesStudent ? 20 : 5,
        flow: hasCorrection ? 20 : 5,
      },
      strengths: ['The answer is too short to show a meaningful mathematical explanation yet.'],
      improvements: [
        'State the student misconception first, then explain the correct idea in at least one or two complete sentences.',
        'Include a mathematical term, a short example, and a student-friendly acknowledgement.',
        reason ? `Fallback note: ${reason}` : 'Fallback note: local demo evaluation was used.',
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
      'The response attempts to connect to the student answer and provide a mathematical explanation.',
      hasExample
        ? 'It includes an example or check that can help the student follow the idea.'
        : 'It focuses on the core concept.',
    ],
    improvements: [
      reason ? `Fallback note: ${reason}` : 'Fallback note: local demo evaluation was used.',
      'Acknowledge why the student may have thought that way before correcting the misconception.',
      'Add a short numerical example or counterexample to make the explanation easier to verify.',
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

  const { achievementStandard, studentUtterance, context, exemplarAnswer, userAnswer } = req.body || {};

  if (!achievementStandard || !studentUtterance || !userAnswer) {
    return res.status(400).json({
      error: 'Missing required parameters: achievementStandard, studentUtterance, and userAnswer are required.',
    });
  }

  try {
    const apiKey = hasUsableApiKey(process.env.OPENAI_API_KEY)
      ? process.env.OPENAI_API_KEY!.trim()
      : undefined;

    if (!apiKey) {
      return res.status(200).json(buildDemoEvaluation(userAnswer, 'OPENAI_API_KEY is not configured.'));
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
      return res.status(200).json(buildDemoEvaluation(userAnswer, `OpenAI request failed with status ${response.status}.`));
    }

    const data = (await response.json()) as any;
    const resultString = data.choices?.[0]?.message?.content;

    if (!resultString) {
      return res.status(200).json(buildDemoEvaluation(userAnswer, 'OpenAI returned an empty response.'));
    }

    try {
      const evaluation = JSON.parse(resultString.trim());
      return res.status(200).json(evaluation);
    } catch {
      console.error('Failed to parse OpenAI JSON output:', resultString);
      return res.status(200).json(buildDemoEvaluation(userAnswer, 'OpenAI returned invalid JSON.'));
    }
  } catch (error: any) {
    console.error('Serverless function error:', error);
    return res.status(200).json(buildDemoEvaluation(userAnswer, 'Server fallback handled an unexpected error.'));
  }
}
