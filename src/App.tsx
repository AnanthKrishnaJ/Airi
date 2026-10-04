import React, { useMemo, useState } from 'react';

type Screen = 'home' | 'daily' | 'ready';

type LessonCard = {
  id: string;
  title: string;
  subtitle: string;
  accent: 'pink' | 'yellow' | 'green' | 'orange';
  progress: number;
  label: string;
};

type Phrase = {
  prompt: string;
  answer: string;
};

const lessonCards: LessonCard[] = [
  { id: 'daily', title: 'Daily phrases', subtitle: 'Spanish', accent: 'pink', progress: 78, label: '70 terms' },
  { id: 'verbs', title: 'Spanish verbs', subtitle: 'Spanish', accent: 'yellow', progress: 12, label: '48 terms' },
  { id: 'dates', title: 'Historic dates', subtitle: 'History', accent: 'green', progress: 28, label: '50 terms' },
  { id: 'marketing', title: 'Marketing terms', subtitle: 'Marketing', accent: 'orange', progress: 32, label: '32 terms' },
];

const phrases: Phrase[] = [
  { prompt: 'Can I have the menu, please?', answer: 'Menu: el menú' },
  { prompt: 'I would like a coffee, please.', answer: 'Coffee: un café, por favor' },
  { prompt: 'Where is the train station?', answer: 'Station: la estación de tren' },
  { prompt: 'How much does this cost?', answer: 'Cost: ¿Cuánto cuesta?' },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [showAnswer, setShowAnswer] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const currentPhrase = useMemo(() => phrases[phraseIndex], [phraseIndex]);

  const handleNextPhrase = () => {
    setShowAnswer(false);
    setPhraseIndex(prev => (prev + 1) % phrases.length);
  };

  return (
    <div className="app-shell">
      <div className="scene">
        <PhoneFrame
          variant="home"
          active={screen === 'home'}
          onSelect={() => setScreen('home')}
          cards={lessonCards}
          onOpenDaily={() => setScreen('daily')}
        />

        <PhoneFrame
          variant="daily"
          active={screen === 'daily'}
          onSelect={() => setScreen('daily')}
          phrase={currentPhrase}
          showAnswer={showAnswer}
          onToggleAnswer={() => setShowAnswer(v => !v)}
          onNextPhrase={handleNextPhrase}
          onReady={() => setScreen('ready')}
        />

        <PhoneFrame
          variant="ready"
          active={screen === 'ready'}
          onSelect={() => setScreen('ready')}
          onStart={() => setScreen('daily')}
        />
      </div>
    </div>
  );
}

function PhoneFrame({
  variant,
  active,
  onSelect,
  cards,
  phrase,
  showAnswer,
  onToggleAnswer,
  onNextPhrase,
  onReady,
  onStart,
  onOpenDaily,
}: {
  variant: 'home' | 'daily' | 'ready';
  active: boolean;
  onSelect: () => void;
  cards?: LessonCard[];
  phrase?: Phrase;
  showAnswer?: boolean;
  onToggleAnswer?: () => void;
  onNextPhrase?: () => void;
  onReady?: () => void;
  onStart?: () => void;
  onOpenDaily?: () => void;
}) {
  return (
    <div className={`phone-frame ${active ? 'is-active' : ''}`} onClick={onSelect}>
      <div className="notch" />
      <div className="status-bar">
        <span className="time">9:41</span>
        <div className="status-icons">
          <span className="signal" />
          <span className="wifi" />
          <span className="battery" />
        </div>
      </div>

      {variant === 'home' && (
        <div className="screen home-screen">
          <div className="title-row">
            <h2>Home</h2>
          </div>

          <div className="search-box">
            <span className="search-icon" />
            <span>Search by name</span>
          </div>

          <div className="tags">
            <span className="tag active">All</span>
            <span className="tag">Spanish</span>
            <span className="tag">Marketing</span>
            <span className="tag">Mind</span>
          </div>

          <div className="card-list">
            {cards?.map(card => (
              <button
                key={card.id}
                className={`lesson-card ${card.accent}`}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  if (card.id === 'daily') onOpenDaily?.();
                }}
              >
                <div className="lesson-copy">
                  <div className="lesson-title">{card.title}</div>
                  <div className="lesson-meta">
                    <span>{card.subtitle}</span>
                    <span>{card.label}</span>
                  </div>
                </div>
                <div className="card-side">
                  <span className="progress-pct">{card.progress}%</span>
                  <span className="arrow" />
                </div>
              </button>
            ))}
          </div>

          <BottomNav />
        </div>
      )}

      {variant === 'daily' && (
        <div className="screen daily-screen">
          <div className="title-row spaced">
            <h3>Daily phrases</h3>
            <button type="button" className="close-button" aria-label="Close" onClick={e => { e.stopPropagation(); onSelect(); }} />
          </div>

          <div className="phrase-card">
            <div className="phrase-badge" />
            <div className="phrase-text">{phrase?.prompt}</div>
            <button type="button" className="answer-button" onClick={e => { e.stopPropagation(); onToggleAnswer?.(); }}>
              {showAnswer ? phrase?.answer : 'Show answer'}
            </button>
            <div className="dots">••••••••••</div>
          </div>

          <div className="section-label">Learning</div>

          <div className="learning-list">
            <button type="button" className="learning-item" onClick={e => { e.stopPropagation(); onNextPhrase?.(); }}>
              <div className="item-left">
                <span className="mini-icon" />
                <div>
                  <div className="item-title">Flashcards</div>
                  <div className="item-sub">Review terms one by one</div>
                </div>
              </div>
              <span className="mini-arrow" />
            </button>

            <button type="button" className="learning-item" onClick={e => { e.stopPropagation(); onReady?.(); }}>
              <div className="item-left">
                <span className="mini-icon" />
                <div>
                  <div className="item-title">Learn</div>
                  <div className="item-sub">Practice with spaced repetition</div>
                </div>
              </div>
              <span className="mini-arrow" />
            </button>

            <button type="button" className="learning-item" onClick={e => { e.stopPropagation(); onReady?.(); }}>
              <div className="item-left">
                <span className="mini-icon" />
                <div>
                  <div className="item-title">Quiz</div>
                  <div className="item-sub">Check knowledge with a quiz</div>
                </div>
              </div>
              <span className="mini-arrow" />
            </button>
          </div>

          <BottomNav />
        </div>
      )}

      {variant === 'ready' && (
        <div className="screen ready-screen">
          <div className="ready-card">
            <div className="blob" />
            <div className="petal" />
            <div className="copy-block">
              <h3>Ready to learn?</h3>
              <p>Connect the terms with the right meanings and see how much you remember.</p>
            </div>
          </div>

          <button type="button" className="start-button" onClick={e => { e.stopPropagation(); onStart?.(); }}>
            Start learning
          </button>

          <BottomNav />
        </div>
      )}
    </div>
  );
}

function BottomNav() {
  return (
    <div className="bottom-nav">
      <div className="nav-item active">
        <span className="nav-icon home-icon" />
        <span>Home</span>
      </div>
      <div className="nav-item">
        <span className="nav-icon sets-icon" />
        <span>Sets</span>
      </div>
      <div className="nav-item plus-item">
        <span className="nav-icon plus-icon" />
        <span>&nbsp;</span>
      </div>
      <div className="nav-item">
        <span className="nav-icon folder-icon" />
        <span>Folder</span>
      </div>
      <div className="nav-item">
        <span className="nav-icon rank-icon" />
        <span>Rank</span>
      </div>
    </div>
  );
}
