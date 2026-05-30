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
  const longEnoughExplanation = meaningfulChars.length >= 20;
  const hasMathTerm =
    /square|root|sqrt|equation|function|factor|expand|sign|graph|vertex|solution|answer|x|y|\d|\u221a|\u00b2|\u03c0|\uc81c\uacf1|\uadfc\ud638|\ub8e8\ud2b8|\ubc29\uc815\uc2dd|\ud568\uc218|\uc778\uc218\ubd84\ud574|\uc804\uac1c|\ubd80\ud638|\uadf8\ub798\ud504|\uaf2d\uc9d3\uc810|\ud574/i.test(
      answer,
    );
  const acknowledgesStudent =
    /yes|right|good question|understand|confus|think|first|student|can see|\ub9de\uc544|\uadf8\ub807\uac8c \uc0dd\uac01|\ud5f7\uac08|\uc88b\uc740 \uc9c8\ubb38|\uc774\ud574|\uba3c\uc800|\uc0dd\uac01\ud560 \uc218/i.test(
      answer,
    );
  const hasCorrection =
    /but|however|because|therefore|so|not|instead|actually|\ud558\uc9c0\ub9cc|\uadf8\ub7f0\ub370|\ub2e4\ub9cc|\uc544\ub2c8\ub77c|\uc65c\ub0d0\ud558\uba74|\ub530\ub77c\uc11c|\uadf8\ub798\uc11c/i.test(
      answer,
    );
  const hasExample =
    /example|substitute|plug|check|for instance|when|if|\uc608\ub97c|\uc608\uc2dc|\ub300\uc785|\ud655\uc778|\ubcf4\uba74|\d/i.test(
      answer,
    );
  const isTooShort = meaningfulChars.length < 12;

  if (isTooShort || (!hasMathTerm && !longEnoughExplanation)) {
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
  const curriculum = Math.min(100, 30 + lengthScore + (hasMathTerm ? 25 : 10) + (hasCorrection ? 15 : 0));
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
