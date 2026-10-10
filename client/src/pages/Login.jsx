import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { btnPrimary, input, label } from '../components/ui.js';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', upiId: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-center bg-ink px-6 py-12 text-paper sm:px-12">
        <h1 className="max-w-md text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Who owes whom, sorted.
        </h1>
        <p className="mt-4 max-w-md text-lg text-[#B9C4DE]">
          Add shared expenses, see the fewest payments that settle the group, and pay each other over UPI.
        </p>
        <div className="mt-10 w-full max-w-xs -rotate-2 rounded-lg bg-white text-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,.6)]" aria-hidden>
          <div className="px-5 pb-4 pt-5">
            <p className="text-sm font-medium text-ink-soft">Aman pays you</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">₹300</p>
          </div>
          <div className="relative border-t-2 border-dashed border-rule px-5 py-4">
            <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-ink" />
            <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-ink" />
            <span className="inline-block rounded-md bg-saffron px-4 py-2 text-sm font-bold">Pay with UPI</span>
          </div>
        </div>
      </section>

      <section className="flex items-center px-6 py-12 sm:px-12">
        <form onSubmit={submit} className="mx-auto w-full max-w-sm space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight">{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className={label}>Name</label>
              <input id="name" required value={form.name} onChange={set('name')} className={input} autoComplete="name" />
            </div>
          )}
          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" type="email" required value={form.email} onChange={set('email')} className={input} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className={label}>Password</label>
            <input id="password" type="password" required minLength={6} value={form.password} onChange={set('password')} className={input} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
          {mode === 'register' && (
            <div>
              <label htmlFor="upi" className={label}>UPI ID (optional)</label>
              <input id="upi" value={form.upiId} onChange={set('upiId')} placeholder="name@bank" className={input} />
              <p className="mt-1 text-sm text-ink-soft">Friends use this to pay you in one tap.</p>
            </div>
          )}
          {error && <p role="alert" className="text-sm font-medium text-owe">{error}</p>}
          <button disabled={busy} className={`${btnPrimary} w-full`}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          <p className="text-sm text-ink-soft">
            {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="font-bold text-ink underline">
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
