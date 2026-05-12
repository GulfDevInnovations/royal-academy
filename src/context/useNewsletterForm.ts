// src/hooks/useNewsletterForm.ts
// Shared between SidebarNav and Footer — pass the source to distinguish them.

import { useState } from 'react';

type State = 'idle' | 'loading' | 'success' | 'error';

export function useNewsletterForm(source: 'sidebar' | 'footer' | 'other') {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || state === 'loading') return;

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong.');
        setState('error');
        return;
      }

      setState('success');
      setEmail('');

      // Reset back to idle after 4 seconds
      setTimeout(() => setState('idle'), 4000);
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  return { email, setEmail, state, errorMsg, handleSubmit };
}
