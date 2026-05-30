import { useState, useEffect } from 'react';
import { UNITS, ALL_SCENARIOS } from './data/scenarios';
import Chatbot from './components/Chatbot';
import type { EvaluationResponse } from './api/chat';

// Structure of saved progress in localStorage
interface ScenarioAttempt {
  completed: boolean;
  score: number;
  userAnswer: string;
  feedback: EvaluationResponse;
}

type ProgressState = Record<string, ScenarioAttempt>;

// Lightweight HTML5/CSS3 Confetti component
function ConfettiEffect() {
  const pieces = Array.from({ length: 100 });
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899'];
  
  return (
    <div className="confetti-container">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = Math.random() * 2.5 + 2.5;
        const size = Math.random() * 10 + 6;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = Math.random() > 0.5 ? '50%' : '2px';
        
        return (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              backgroundColor: color,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: shape,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'scenarios' | 'practice'>('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  
  // Progress state loaded from localStorage
  const [progress, setProgress] = useState<ProgressState>({});
  
  // Confetti celebrations states
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebratedUnitTitle, setCelebratedUnitTitle] = useState('');

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('math_teacher_practice_progress');
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load progress from localStorage:', e);
    }
  }, []);

  // Save progress changes to localStorage
  const saveProgress = (newProgress: ProgressState) => {
    setProgress(newProgress);
    try {
      localStorage.setItem('math_teacher_practice_progress', JSON.stringify(newProgress));
    } catch (e) {
      console.error('Failed to save progress to localStorage:', e);
    }
  };

  const resetProgress = () => {
    if (window.confirm('모든 연습 진행 상황과 점수를 초기화하시겠습니까?')) {
      saveProgress({});
      setActiveView('dashboard');
      setSelectedUnitId(null);
      setSelectedScenarioId(null);
    }
  };

  // Find helper functions
  const selectedUnit = UNITS.find((u) => u.id === selectedUnitId);
  const selectedScenario = ALL_SCENARIOS.find((s) => s.id === selectedScenarioId);

  // Stats calculation
  const totalScenarios = ALL_SCENARIOS.length;
  const completedCount = Object.keys(progress).filter((id) => progress[id]?.completed).length;
  const overallProgressPercentage = totalScenarios > 0 ? (completedCount / totalScenarios) * 100 : 0;
  
  const averageScore = (() => {
    const attempts = Object.values(progress).filter((p) => p.completed);
    if (attempts.length === 0) return 0;
    const total = attempts.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(total / attempts.length);
  })();

  const getUnitCompletedCount = (unitId: number) => {
    const unitScenarios = UNITS.find((u) => u.id === unitId)?.scenarios || [];
    return unitScenarios.filter((s) => progress[s.id]?.completed).length;
  };

  const handleCompleteScenario = (averageScore: number, feedback: EvaluationResponse, userAnswer: string) => {
    if (!selectedScenario) return;

    const unitOfScenario = UNITS.find((u) => u.id === selectedScenario.unitId);
    if (!unitOfScenario) return;

    const wasUnitAlreadyCompleted = getUnitCompletedCount(unitOfScenario.id) === unitOfScenario.scenarios.length;

    // Save attempt
    const newProgress = {
      ...progress,
      [selectedScenario.id]: {
        completed: true,
        score: averageScore,
        userAnswer,
        feedback,
      },
    };
    saveProgress(newProgress);

    // Re-evaluate if unit became completed just now
    const unitScenarios = unitOfScenario.scenarios;
    const completedInUnitNow = unitScenarios.filter((s) => newProgress[s.id]?.completed).length;
    const isUnitCompletedNow = completedInUnitNow === unitScenarios.length;

    if (isUnitCompletedNow && !wasUnitAlreadyCompleted) {
      setCelebratedUnitTitle(unitOfScenario.title);
      setShowConfetti(true);
    }
  };

  const handleCloseConfettiModal = () => {
    setShowConfetti(false);
    setCelebratedUnitTitle('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Confetti & Modal Celebration */}
      {showConfetti && (
        <>
          <ConfettiEffect />
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '24px'
          }}>
            <div className="card animate-scale-in" style={{ 
              maxWidth: '500px', 
              textAlign: 'center', 
              background: 'white', 
              padding: '40px 32px',
              borderColor: 'var(--primary-400)',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                background: 'var(--primary-100)',
                color: 'var(--primary-600)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                marginBottom: '8px',
                animation: 'float 2s ease-in-out infinite'
              }}>
                🎉
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                단원 완료를 축하합니다!
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--neutral-600)', lineHeight: '1.6' }}>
                <strong>[{celebratedUnitTitle}]</strong> 단원의 모든 시나리오 오개념 교정 연습을 무사히 완료하셨습니다. 학생의 오개념을 진단하고 설명하는 역량이 한 단계 더 성장했습니다!
              </p>
              <button 
                onClick={handleCloseConfettiModal} 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '12px' }}
              >
                닫기 및 확인
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header bar */}
      <header>
        <div className="container header-content">
          <div className="logo-container" onClick={() => { setActiveView('dashboard'); setSelectedUnitId(null); setSelectedScenarioId(null); }}>
            <div className="logo-icon">𝝅</div>
            <div>
              <span className="logo-text">수학교사 오개념 교정 연습실</span>
              <span className="logo-badge" style={{ marginLeft: '8px' }}>Pre-service Math T</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {completedCount > 0 && (
              <button 
                onClick={resetProgress}
                style={{
                  background: 'none',
                  color: 'var(--neutral-400)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                진행 상황 초기화
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px 0' }}>
        <div className="container">
          
          {/* VIEW 1: DASHBOARD */}
          {activeView === 'dashboard' && (
            <div className="animate-fade">
              {/* Hero Banner */}
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 className="title-main">예비 수학교사를 위한 오개념 교정 연습</h1>
                <p className="subtitle-main">
                  중학교 학생들의 수학적 오개념을 분석하고, 학생의 눈높이에 맞춰 올바르게 설명하는 연습을 해보세요.
                </p>
              </div>

              {/* Progress Summary Card */}
              <div className="card" style={{ 
                background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-950) 100%)', 
                color: 'white',
                borderColor: 'transparent',
                marginBottom: '40px',
                padding: '32px'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontWeight: 600 }}>
                      전체 연습 진척도
                    </span>
                    <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'white', marginTop: '4px' }}>
                      {completedCount} / {totalScenarios} 완료
                    </h2>
                  </div>
                  {completedCount > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', opacity: 0.8, fontWeight: 600 }}>평균 피드백 점수</span>
                      <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>
                        {averageScore}점
                      </h2>
                    </div>
                  )}
                </div>

                <div className="progress-container" style={{ background: 'rgba(255,255,255,0.15)', height: '10px' }}>
                  <div className="progress-fill" style={{ width: `${overallProgressPercentage}%`, background: 'linear-gradient(90deg, #60a5fa 0%, #34d399 100%)' }}></div>
                </div>
                
                <p style={{ fontSize: '13px', marginTop: '12px', opacity: 0.8, fontStyle: 'italic' }}>
                  * 각 단원의 시나리오를 선택하여 학습을 완료할 때마다 실시간 AI 채점 및 개별 강점/보완점을 분석해 드립니다.
                </p>
              </div>

              {/* Unit Card Grid */}
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '8px' }}>
                단원 선택
              </h2>

              <div className="grid-units">
                {UNITS.map((unit) => {
                  const completed = getUnitCompletedCount(unit.id);
                  const total = unit.scenarios.length;
                  const isUnitDone = completed === total;
                  
                  return (
                    <div 
                      key={unit.id} 
                      className="card"
                      onClick={() => {
                        setSelectedUnitId(unit.id);
                        setActiveView('scenarios');
                      }}
                      style={{ 
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '24px',
                        borderColor: isUnitDone ? 'var(--success)' : 'var(--border-color)',
                        background: isUnitDone ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-card)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isUnitDone ? 'var(--success)' : 'var(--primary-500)' }}>
                            {unit.id}단원
                          </span>
                          {isUnitDone && (
                            <span style={{ fontSize: '11px', background: 'var(--success-light)', color: 'var(--success)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                              완료됨
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--neutral-900)', lineHeight: '1.4' }}>
                          {unit.title}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                          <span style={{ color: 'var(--neutral-500)' }}>학습 완료도</span>
                          <span style={{ color: 'var(--neutral-800)' }}>{completed} / {total} 완료</span>
                        </div>
                        <div className="progress-container">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${(completed / total) * 100}%`,
                              background: isUnitDone ? 'var(--success)' : 'var(--primary-500)'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: SCENARIOS LIST */}
          {activeView === 'scenarios' && selectedUnit && (
            <div className="animate-fade">
              {/* Breadcrumbs & Header */}
              <div style={{ marginBottom: '24px' }}>
                <button 
                  onClick={() => { setActiveView('dashboard'); setSelectedUnitId(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-600)',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    marginBottom: '12px'
                  }}
                >
                  &larr; 전체 단원 목록으로 돌아가기
                </button>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-400)' }}>
                      제 {selectedUnit.id}단원
                    </span>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--neutral-900)', margin: '4px 0 0' }}>
                      {selectedUnit.title}
                    </h1>
                  </div>
                  
                  <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                      <span style={{ color: 'var(--neutral-500)' }}>단원 진행도</span>
                      <span style={{ color: 'var(--neutral-800)' }}>
                        {getUnitCompletedCount(selectedUnit.id)} / {selectedUnit.scenarios.length} 완료
                      </span>
                    </div>
                    <div className="progress-container">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(getUnitCompletedCount(selectedUnit.id) / selectedUnit.scenarios.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scenario cards grid */}
              <div className="grid-scenarios">
                {selectedUnit.scenarios.map((scenario) => {
                  const attempt = progress[scenario.id];
                  const isDone = attempt?.completed;
                  
                  return (
                    <div 
                      key={scenario.id} 
                      className="card"
                      onClick={() => {
                        setSelectedScenarioId(scenario.id);
                        setActiveView('practice');
                      }}
                      style={{ 
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '20px',
                        borderLeft: isDone ? '4px solid var(--success)' : '4px solid var(--primary-400)',
                        background: isDone ? 'rgba(16, 185, 129, 0.01)' : 'var(--bg-card)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--neutral-400)' }}>
                            시나리오 {scenario.id}
                          </span>
                          {isDone ? (
                            <span style={{ 
                              fontSize: '11px', 
                              background: 'var(--success-light)', 
                              color: 'var(--success)', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontWeight: 700 
                            }}>
                              평가점수: {attempt.score}점
                            </span>
                          ) : (
                            <span style={{ 
                              fontSize: '11px', 
                              background: 'var(--primary-50)', 
                              color: 'var(--primary-700)', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontWeight: 700 
                            }}>
                              대기 중
                            </span>
                          )}
                        </div>

                        <div>
                          <span style={{ display: 'inline-block', fontSize: '11px', background: 'var(--neutral-100)', color: 'var(--neutral-500)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, marginBottom: '4px' }}>
                            성취기준
                          </span>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--neutral-600)', lineHeight: '1.4' }}>
                            {scenario.achievementStandard}
                          </p>
                        </div>

                        <div>
                          <span style={{ display: 'inline-block', fontSize: '11px', background: 'rgba(255, 107, 107, 0.1)', color: '#e03131', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, marginBottom: '4px' }}>
                            학생 발화
                          </span>
                          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', fontStyle: 'italic' }}>
                            "{scenario.studentUtterance}"
                          </p>
                        </div>
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end', 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: 'var(--primary-600)' 
                      }}>
                        <span>{isDone ? '내 평가 결과 확인 & 재학습 →' : '연습실 입장하기 →'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: PRACTICE MODE */}
          {activeView === 'practice' && selectedScenario && (
            <Chatbot 
              scenario={selectedScenario}
              onBack={() => {
                // Return to scenarios list of selected unit
                setSelectedScenarioId(null);
                setActiveView('scenarios');
              }}
              savedAttempt={progress[selectedScenario.id] ? {
                userAnswer: progress[selectedScenario.id].userAnswer,
                feedback: progress[selectedScenario.id].feedback,
              } : undefined}
              onComplete={handleCompleteScenario}
            />
          )}

        </div>
      </main>

      {/* Footer bar */}
      <footer style={{ 
        borderTop: '1px solid var(--border-color)', 
        padding: '24px 0', 
        background: 'rgba(255,255,255,0.4)', 
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--neutral-400)',
        marginTop: 'auto'
      }}>
        <div className="container">
          &copy; {new Date().getFullYear()} 예비 수학교사를 위한 오개념 교정 연습실. AI-Powered PCK Evaluation Platform.
        </div>
      </footer>
    </div>
  );
}
