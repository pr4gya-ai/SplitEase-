import { useState } from 'react';
import { api } from '../api/client.js';
import { toPaise } from '../utils/format.js';
import NaturalLanguageInput from './NaturalLanguageInput.jsx';
import SplitEditor from './SplitEditor.jsx';

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
    const amountPaise = toPaise(amount);
    const chosen = members.filter((m) => included.has(m._id));
    const customTotal = chosen.reduce((t, m) => t + (toPaise(custom[m._id] || 0) || 0), 0);

    if (!description.trim()) return setError('Add a description.');
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) return setError('Enter an amount greater than zero.');
    if (!chosen.length) return setError('Choose at least one person to split with.');

    const body = { description, amount: amountPaise, paidBy, splitType };
    if (splitType === 'equal') {
      body.participants = chosen.map((m) => m._id);
    } else {
      if (amountPaise - customTotal !== 0) return setError('Custom amounts must add up to the total.');
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
          <NaturalLanguageInput
            text={text}
            onChange={setText}
            onSubmit={parse}
            parsing={parsing}
            error={error}
          />
        ) : (
          <SplitEditor
            members={members}
            me={me}
            note={note}
            error={error}
            saving={saving}
            description={description} setDescription={setDescription}
            amount={amount} setAmount={setAmount}
            paidBy={paidBy} setPaidBy={setPaidBy}
            splitType={splitType} setSplitType={setSplitType}
            included={included} setIncluded={setIncluded}
            custom={custom} setCustom={setCustom}
            onSave={save}
            onClear={reset}
          />
        )}
      </div>
    </div>
  );
}
