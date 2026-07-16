'use client';

import { useState, useEffect } from 'react';
import { Container, Button, Card } from '@pte-app/design-system';

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/learn/quiz/${id}/items`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setAnswers(Array(data.items?.length || 0).fill([]));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
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
    <main style={{ paddingTop: '3rem' }}>
      <Container>
        <h1 data-testid="quiz-title">Quiz</h1>
        {result ? (
          <Card data-testid="quiz-result">
            <p>
              Score: {result.attempt.score}/{result.attempt.totalItems}
            </p>
            <p>{result.passed ? 'passed' : 'failed'}</p>
          </Card>
        ) : (
          <div>
            {items.map((item, itemIdx) => (
              <Card key={item.id} style={{ marginBottom: '1rem' }}>
                <p>{item.question}</p>
                {item.options.map((option: string, optionIdx: number) => (
                  <label key={optionIdx} style={{ display: 'block', margin: '0.5rem 0' }}>
                    <input
                      type="checkbox"
                      checked={answers[itemIdx]?.includes(optionIdx)}
                      onChange={() => toggleAnswer(itemIdx, optionIdx)}
                    />
                    {option}
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

function use<T>(promise: Promise<T>): T {
  return (promise as any).read?.() ?? (promise as any);
}
