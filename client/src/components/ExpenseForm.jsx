import { useState } from 'react';
import { api } from '../api/client.js';
import { formatINR, toPaise } from '../utils/format.js';
import { btnPrimary, btnQuiet, input, label } from './ui.js';

export default function ExpenseForm({ group, me, onSaved }) {
  const members = group.members;
  const allIds = () => new Set(members.map((m) => m._id));

  const [tab, setTab] = useState('describe');
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [note, setNote] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(me.id);
  const [splitType, setSplitType] = useState('equal');
  const [included, setIncluded] = useState(allIds);
  const [custom, setCustom] = useState({});

  const amountPaise = toPaise(amount);
  const chosen = members.filter((m) => included.has(m._id));
  const customTotal = chosen.reduce((t, m) => t + (toPaise(custom[m._id] || 0) || 0), 0);
  const remaining = amountPaise - customTotal;

  const toggle = (id) =>
    setIncluded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const reset = () => {
    setText(''); setDescription(''); setAmount(''); setPaidBy(me.id);
    setSplitType('equal'); setIncluded(allIds()); setCustom({}); setNote(null); setError('');
  };

  const parse = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setParsing(true);
    setError('');
    try {
      const { draft, unmatched, source } = await api.parseExpense(group._id, text);
      setDescription(draft.description);
      setAmount(String(draft.amount / 100));
      setPaidBy(draft.paidBy);
      setIncluded(new Set(draft.participants));
      setSplitType('equal');
      setNote({
        text: `Read with ${source === 'gemini' ? 'AI' : 'simple rules'}. Check the details, then save.`,
        warn: unmatched.length ? `No one named ${unmatched.join(', ')} is in this group.` : '',
      });
      setTab('details');
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!description.trim()) return setError('Add a description.');
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) return setError('Enter an amount greater than zero.');
    if (!chosen.length) return setError('Choose at least one person to split with.');

    const body = { description, amount: amountPaise, paidBy, splitType };
    if (splitType === 'equal') {
      body.participants = chosen.map((m) => m._id);
    } else {
      if (remaining !== 0) return setError('Custom amounts must add up to the total.');
      body.splits = chosen.map((m) => ({ user: m._id, amount: toPaise(custom[m._id] || 0) }));
    }

    setSaving(true);
    try {
      await api.createExpense(group._id, body);
      reset();
      setTab('describe');
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabCls = (t) =>
    `px-4 py-2 text-sm font-bold border-b-2 -mb-px ${tab === t ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'}`;

  return (
    <div className="rounded-lg bg-white ring-1 ring-rule">
      <div role="tablist" className="flex border-b border-rule px-2">
        <button role="tab" aria-selected={tab === 'describe'} onClick={() => setTab('describe')} className={tabCls('describe')}>
          Describe it
        </button>
        <button role="tab" aria-selected={tab === 'details'} onClick={() => setTab('details')} className={tabCls('details')}>
          Enter details
        </button>
      </div>

      <div className="p-5">
        {tab === 'describe' ? (
          <form onSubmit={parse}>
            <label htmlFor="nl" className={label}>Type what happened</label>
            <input
              id="nl" value={text} onChange={(e) => setText(e.target.value)} maxLength={300}
              placeholder="dinner 1200 split with Rahul and Aman" className={input}
            />
            <p className="mt-2 text-sm text-ink-soft">
              We fill in the details for you to check. Nothing is saved until you press Save expense.
            </p>
            <button disabled={parsing || !text.trim()} className={`${btnPrimary} mt-4`}>
              {parsing ? 'Reading…' : 'Fill in details'}
            </button>
          </form>
        ) : (
          <form onSubmit={save} className="space-y-4">
            {note && (
              <div className="rounded-md bg-saffron-tint px-3 py-2 text-sm">
                <p>{note.text}</p>
                {note.warn && <p className="mt-1 font-medium text-owe">{note.warn}</p>}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
              <div>
                <label htmlFor="desc" className={label}>What was it for?</label>
                <input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className={input} placeholder="Dinner at Toit" />
              </div>
              <div>
                <label htmlFor="amt" className={label}>Amount (₹)</label>
                <input id="amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={input} placeholder="1200" />
              </div>
            </div>

            <div>
              <label htmlFor="payer" className={label}>Paid by</label>
              <select id="payer" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={input}>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m._id === me.id ? `${m.name} (you)` : m.name}</option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className={label}>Split</legend>
              <div className="mb-3 flex gap-2">
                {['equal', 'custom'].map((t) => (
                  <button
                    type="button" key={t} onClick={() => setSplitType(t)} aria-pressed={splitType === t}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium ${splitType === t ? 'border-ink bg-ink text-paper' : 'border-rule bg-white'}`}
                  >
                    {t === 'equal' ? 'Equally' : 'Custom amounts'}
                  </button>
                ))}
              </div>
              <ul className="divide-y divide-rule rounded-md border border-rule">
                {members.map((m) => (
                  <li key={m._id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={included.has(m._id)} onChange={() => toggle(m._id)} className="h-4 w-4 accent-[#101B33]" />
                      <span>{m._id === me.id ? `${m.name} (you)` : m.name}</span>
                    </label>
                    {splitType === 'custom' && included.has(m._id) && (
                      <input
                        aria-label={`Amount for ${m.name}`} inputMode="decimal" placeholder="0"
                        value={custom[m._id] || ''} onChange={(e) => setCustom({ ...custom, [m._id]: e.target.value })}
                        className={`${input} !w-28 !py-1.5 text-right`}
                      />
                    )}
                  </li>
                ))}
              </ul>
              {splitType === 'custom' && Number.isInteger(amountPaise) && amountPaise > 0 && (
                <p className={`mt-2 text-sm font-medium ${remaining === 0 ? 'text-owed' : 'text-owe'}`}>
                  {remaining === 0 ? 'Amounts add up.' : remaining > 0 ? `${formatINR(remaining)} left to assign.` : `${formatINR(-remaining)} over the total.`}
                </p>
              )}
            </fieldset>

            {error && <p role="alert" className="text-sm font-medium text-owe">{error}</p>}
            <div className="flex gap-2">
              <button disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save expense'}</button>
              <button type="button" onClick={reset} className={btnQuiet}>Clear</button>
            </div>
          </form>
        )}
        {tab === 'describe' && error && <p role="alert" className="mt-3 text-sm font-medium text-owe">{error}</p>}
      </div>
    </div>
  );
}
