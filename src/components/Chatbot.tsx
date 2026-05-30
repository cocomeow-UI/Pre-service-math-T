import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { Scenario } from '../data/scenarios';
import { evaluateAnswer } from '../api/chat';
import type { EvaluationResponse } from '../api/chat';

interface ChatbotProps {
  scenario: Scenario;
  onBack: () => void;
  onComplete: (averageScore: number, feedback: EvaluationResponse, userAnswer: string) => void;
  savedAttempt?: {
    userAnswer: string;
    feedback: EvaluationResponse;
  };
}

export default function Chatbot({ scenario, onBack, onComplete, savedAttempt }: ChatbotProps) {
  const [userAnswer, setUserAnswer] = useState(savedAttempt?.userAnswer || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<EvaluationResponse | null>(savedAttempt?.feedback || null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [loadingQuoteIndex, setLoadingQuoteIndex] = useState(0);

  const loadingQuotes = [
    'AI 수학 교수학습 평가위원이 답변을 검토하고 있습니다...',
    '중학교 3학년 학생의 눈높이에 맞는 설명인지 분석 중입니다...',
    '성취기준과 교육과정 용어를 정확하게 사용했는지 검증하는 중입니다...',
    '오개념에서 올바른 수학 개념으로 이어지는 논리적 흐름을 평가하고 있습니다...'
  ];

  // Rotate loading text while evaluating
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingQuoteIndex((prev) => (prev + 1) % loadingQuotes.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setLoading(true);
    setError(null);
    setShowModelAnswer(false);

    try {
      const result = await evaluateAnswer({
        achievementStandard: scenario.achievementStandard,
        studentUtterance: scenario.studentUtterance,
        context: scenario.context,
        exemplarAnswer: scenario.exemplarAnswer,
        userAnswer: userAnswer.trim(),
      });

      setFeedback(result);
      
      // Calculate overall average score
      const average = Math.round(
        (result.scores.curriculum + result.scores.eyeLevel + result.scores.flow) / 3
      );
      
      onComplete(average, result, userAnswer.trim());
    } catch (err: any) {
      console.error(err);
      setError(err.message || '평가 도중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setShowModelAnswer(false);
    setUserAnswer('');
    setError(null);
  };

  return (
    <div className="animate-slide-up" style={{ width: '100%', maxWidth: '960px', margin: '0 auto', padding: '16px 0 60px' }}>
      
      {/* Back button & Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button 
          onClick={onBack}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          단원 목록으로
        </button>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-400)' }}>
          {scenario.unitTitle} &middot; 시나리오 {scenario.id}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', alignItems: 'start' }} className={feedback ? 'chatbot-grid-evaluated' : ''}>
        
        {/* practice pane */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '4px' }}>
              오개념 교정 연습실
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--neutral-500)' }}>
              학생의 발화를 관찰하고 성취기준을 준수하여 설명해 주세요.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)' }}>
            <span style={{ display: 'inline-block', fontSize: '11px', background: 'var(--primary-200)', color: 'var(--primary-800)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, marginBottom: '6px' }}>
              성취기준
            </span>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--primary-900)', lineHeight: '1.5' }}>
              {scenario.achievementStandard}
            </p>
          </div>

          {/* Student utterance bubble */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff6b6b' }}></span>
              질문하는 학생 (중3)
            </span>
            <div style={{ 
              background: '#fff0f0', 
              color: '#343a40', 
              padding: '16px 20px', 
              borderRadius: '0 16px 16px 16px', 
              borderLeft: '4px solid #ff6b6b',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}>
              <p style={{ fontSize: '16px', fontWeight: 600, fontStyle: 'italic', letterSpacing: '-0.3px', color: '#1e293b' }}>
                "{scenario.studentUtterance}"
              </p>
            </div>
          </div>

          {/* Teacher answer input form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-700)' }}>
                교사 피드백 설명 작성
              </label>
              <span style={{ fontSize: '12px', color: userAnswer.length < 30 ? 'var(--neutral-400)' : 'var(--success)' }}>
                {userAnswer.length}자 작성 중
              </span>
            </div>
            
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={loading || !!feedback}
            />

            {!feedback ? (
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !userAnswer.trim()}
                style={{ width: '100%', padding: '14px 20px', fontSize: '16px' }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="spinner" style={{
                      width: '18px',
                      height: '18px',
                      border: '3px solid rgba(255,255,255,0.3)',
                      borderTop: '3px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></div>
                    <span>평가 중...</span>
                  </div>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                    설명 제출하고 피드백 받기
                  </>
                )}
              </button>
            ) : null}
          </form>

          {/* Loader screen overlay details */}
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '24px', 
              background: 'var(--neutral-50)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px dashed var(--neutral-300)',
              marginTop: '8px'
            }}>
              <p style={{ fontWeight: 600, color: 'var(--primary-600)', marginBottom: '8px' }} className="animate-fade">
                {loadingQuotes[loadingQuoteIndex]}
              </p>
              <div style={{ 
                height: '4px', 
                width: '120px', 
                background: 'var(--neutral-200)', 
                margin: '0 auto', 
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  background: 'var(--primary-500)', 
                  width: '50%', 
                  borderRadius: '2px',
                  animation: 'loadingBar 1.5s ease-in-out infinite' 
                }}></div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ 
              padding: '14px', 
              background: 'var(--danger-light)', 
              border: '1px solid #fda4af', 
              borderRadius: 'var(--radius-md)', 
              color: 'var(--danger)', 
              fontSize: '14px',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}
        </div>

        {/* feedback output card */}
        {feedback && (
          <div className="card animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'white', borderColor: 'var(--primary-300)' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--neutral-900)' }}>AI 평가 리포트</h2>
                {feedback.isDemo && (
                  <span style={{ fontSize: '11px', background: 'var(--warning-light)', color: 'var(--warning)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #fde68a' }}>
                    데모 모드
                  </span>
                )}
              </div>
              <button 
                onClick={handleRetry} 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                다시 풀어보기
              </button>
            </div>

            {/* Score Indicators Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
              
              {/* Score 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '8px' }}>
                  교육과정 준수
                </span>
                <div className="score-circle-container">
                  <svg className="score-circle-svg">
                    <circle className="score-circle-bg" cx="40" cy="40" r="32" />
                    <circle 
                      className="score-circle-fill" 
                      cx="40" 
                      cy="40" 
                      r="32" 
                      strokeDashoffset={226 - (226 * feedback.scores.curriculum) / 100}
                    />
                  </svg>
                  <span className="score-text" style={{ color: 'var(--primary-700)' }}>
                    {feedback.scores.curriculum}
                  </span>
                </div>
              </div>

              {/* Score 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '8px' }}>
                  학생 눈높이
                </span>
                <div className="score-circle-container">
                  <svg className="score-circle-svg">
                    <circle className="score-circle-bg" cx="40" cy="40" r="32" />
                    <circle 
                      className="score-circle-fill" 
                      cx="40" 
                      cy="40" 
                      r="32" 
                      style={{ stroke: 'var(--success)' }}
                      strokeDashoffset={226 - (226 * feedback.scores.eyeLevel) / 100}
                    />
                  </svg>
                  <span className="score-text" style={{ color: '#047857' }}>
                    {feedback.scores.eyeLevel}
                  </span>
                </div>
              </div>

              {/* Score 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-500)', marginBottom: '8px' }}>
                  논리적 흐름
                </span>
                <div className="score-circle-container">
                  <svg className="score-circle-svg">
                    <circle className="score-circle-bg" cx="40" cy="40" r="32" />
                    <circle 
                      className="score-circle-fill" 
                      cx="40" 
                      cy="40" 
                      r="32" 
                      style={{ stroke: 'var(--info)' }}
                      strokeDashoffset={226 - (226 * feedback.scores.flow) / 100}
                    />
                  </svg>
                  <span className="score-text" style={{ color: '#0e7490' }}>
                    {feedback.scores.flow}
                  </span>
                </div>
              </div>

            </div>

            {/* Strengths */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                잘한 점
              </h3>
              <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {feedback.strengths.map((item, idx) => (
                  <li key={idx} style={{ 
                    fontSize: '14px', 
                    color: 'var(--neutral-700)', 
                    padding: '8px 12px', 
                    background: 'var(--success-light)', 
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--success)',
                    lineHeight: '1.5'
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                보완하면 좋은 점
              </h3>
              <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {feedback.improvements.map((item, idx) => (
                  <li key={idx} style={{ 
                    fontSize: '14px', 
                    color: 'var(--neutral-700)', 
                    padding: '8px 12px', 
                    background: 'var(--warning-light)', 
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--warning)',
                    lineHeight: '1.5'
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Model answer reveal button */}
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
              <button 
                onClick={() => setShowModelAnswer(!showModelAnswer)} 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>{showModelAnswer ? '모범답변 숨기기' : '모범답변 보기'}</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                  style={{ 
                    transform: showModelAnswer ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {showModelAnswer && (
                <div className="animate-slide-up" style={{ 
                  marginTop: '12px', 
                  padding: '16px', 
                  background: 'var(--primary-50)', 
                  border: '1px solid var(--primary-200)', 
                  borderRadius: 'var(--radius-md)' 
                }}>
                  <span style={{ display: 'inline-block', fontSize: '11px', background: 'var(--primary-200)', color: 'var(--primary-800)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, marginBottom: '8px' }}>
                    권장 모범답변 예시
                  </span>
                  <p style={{ fontSize: '14px', color: 'var(--neutral-800)', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                    {scenario.exemplarAnswer}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
      
      {/* CSS injection for local styling */}
      <style>{`
        .chatbot-grid-evaluated {
          grid-template-columns: 1.1fr 0.9fr !important;
        }
        @media (max-width: 900px) {
          .chatbot-grid-evaluated {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
