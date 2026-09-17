'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { MEMORY_STORE_CHANGED } from '@/lib/memory-store';

type AuthSession = {
  authenticated: boolean;
  isAnonymous: boolean;
  email?: string | null;
};

type AuthMode = 'register' | 'login';

const anonymousSession: AuthSession = { authenticated: false, isAnonymous: true, email: null };

async function readResponse(response: Response) {
  const body = await response.json().catch(() => ({})) as { error?: string; email?: string; ok?: boolean };
  if (!response.ok) throw new Error(body.error ?? '잠시 후 다시 시도해 주세요.');
  return body;
}

export function AuthPanel() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => response.json() as Promise<AuthSession>)
      .then((next) => { if (active) setSession(next); })
      .catch(() => { if (active) setSession(anonymousSession); });
    return () => { active = false; };
  }, []);

  function openPanel(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setPassword('');
    setOpen(true);
  }

  function closePanel() {
    if (busy) return;
    setOpen(false);
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('이메일 주소를 확인해 주세요.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상으로 입력해 주세요.');
      return;
    }

    setBusy(true);
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const result = await readResponse(response);
      setSession({ authenticated: true, isAnonymous: false, email: result.email ?? trimmedEmail });
      setPassword('');
      setOpen(false);
      window.dispatchEvent(new CustomEvent(MEMORY_STORE_CHANGED));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await readResponse(await fetch('/api/auth/logout', { method: 'POST' }));
      setSession(anonymousSession);
      window.dispatchEvent(new CustomEvent(MEMORY_STORE_CHANGED));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '로그아웃하지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  if (!session) return <div className="auth-panel-placeholder" aria-hidden="true" />;

  return <>
    <div className="auth-entry" onPointerDown={(event) => event.stopPropagation()}>
      {session.authenticated ? <>
        <span className="auth-email" title={session.email ?? '로그인됨'}>{session.email ?? '로그인됨'}</span>
        <button className="auth-status-button auth-logout" type="button" onClick={logout} disabled={busy}>로그아웃</button>
      </> : <button className="auth-status-button" type="button" onClick={() => openPanel('register')}>내 별 저장 <span>✦</span></button>}
    </div>

    {open && <div className="auth-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) closePanel(); }}>
      <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title" onPointerDown={(event) => event.stopPropagation()}>
        <button className="auth-close" type="button" aria-label="인증 창 닫기" onClick={closePanel}>×</button>
        <span className="auth-kicker">KEEP YOUR STARS</span>
        <h2 id="auth-title">{mode === 'register' ? '이 밤하늘을 간직할까요?' : '다시 별 곁으로'}</h2>
        <p>{mode === 'register' ? '지금 만든 기억별을 다른 기기에서도 만날 수 있어요.' : '이메일과 비밀번호로 당신의 별을 다시 불러와요.'}</p>
        <form onSubmit={submit}>
          <label>이메일<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label>비밀번호<input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상" minLength={8} required /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? '별빛을 확인하는 중...' : mode === 'register' ? '내 별 저장하기' : '로그인하기'} <span>✦</span></button>
        </form>
        <button className="auth-mode-toggle" type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>
          {mode === 'register' ? '이미 계정이 있어요 · 로그인' : '처음이신가요 · 내 별 저장하기'}
        </button>
      </section>
    </div>}
  </>;
}
