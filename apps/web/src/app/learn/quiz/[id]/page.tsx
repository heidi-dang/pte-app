'use client';

import { useState, useEffect, use } from 'react';
import { Container, Button, Card, Badge } from '@pte-app/design-system';

const MOCK_ITEMS = [
  {
    id: 'qi-1',
    question: 'What is the primary purpose of the introduction paragraph in a PTE essay?',
    options: ['To summarise the conclusion', 'To present the main argument and outline', 'To list every example', 'To repeat the prompt'],
    correct: [1],
  },
  {
    id: 'qi-2',
    question: 'Which two skills are assessed by the Repeat Sentence task?',
    options: ['Listening and speaking', 'Reading and writing', 'Writing and listening', 'Speaking and reading'],
    correct: [0],
  },
];

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/learn/quiz/${id}/items`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setAnswers(Array(data.items?.length || 0).fill([]));
        setLoading(false);
      })
      .catch(() => {
        // Fallback to mock quiz items
        setItems(MOCK_ITEMS);
        setAnswers(Array(MOCK_ITEMS.length).fill([]));
        setLoading(false);
      });
  }, [id]);

  function toggleAnswer(itemIdx: number, optionIdx: number) {
    setAnswers((prev) => {
      const next = prev.map((a) => [...a]);
      const current = next[itemIdx] || [];
      if (current.includes(optionIdx)) {
        next[itemIdx] = current.filter((i) => i !== optionIdx);
      } else {
        next[itemIdx] = [...current, optionIdx].sort();
      }
      return next;
    });
  }

  async function submit() {
    try {
      const submissionId = `quiz-${Date.now()}`;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/learn/quiz/${id}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quiz submission failed');
      setResult(data);
    } catch {
      // Mock result
      const score = answers.reduce((acc, ans, idx) => {
        const correct = MOCK_ITEMS[idx]?.correct || [];
        return acc + (JSON.stringify(ans.sort()) === JSON.stringify(correct.sort()) ? 1 : 0);
      }, 0);
      setResult({ attempt: { score, totalItems: MOCK_ITEMS.length }, passed: score >= 1 });
    }
  }

  if (loading)
    return (
      <Container>
        <p data-testid="quiz-loading">Loading...</p>
      </Container>
    );
  if (error)
    return (
      <Container>
        <p data-testid="quiz-error">{error}</p>
      </Container>
    );

  return (
    <main>
      <Container>
        <h1 data-testid="quiz-title" className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Quiz</h1>
        {result ? (
          <Card data-testid="quiz-result">
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Score: <strong>{result.attempt.score}/{result.attempt.totalItems}</strong>
            </p>
            <Badge variant={result.passed ? 'success' : 'danger'}>{result.passed ? 'passed' : 'failed'}</Badge>
            <div style={{ marginTop: '1rem' }}>
              <a href="/learn/catalogue">
                <Button variant="secondary">Back to courses</Button>
              </a>
            </div>
          </Card>
        ) : (
          <div>
            {items.map((item, itemIdx) => (
              <Card key={item.id} style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 500, marginBottom: '1rem' }}>{item.question}</p>
                {item.options.map((option: string, optionIdx: number) => (
                  <label key={optionIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={answers[itemIdx]?.includes(optionIdx)}
                      onChange={() => toggleAnswer(itemIdx, optionIdx)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </Card>
            ))}
            <Button data-testid="quiz-submit" onClick={submit}>
              Submit
            </Button>
          </div>
        )}
      </Container>
    </main>
  );
}
