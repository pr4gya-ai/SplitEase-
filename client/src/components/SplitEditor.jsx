import { formatINR, toPaise } from '../utils/format.js';
import { btnPrimary, btnQuiet, input, label } from './ui.js';

// "Enter details" tab: description, amount, payer, equal/custom split,
// member checkboxes, custom amounts, note banner, error, Save/Clear.
export default function SplitEditor({
  members, me, note, error, saving,
  description, setDescription,
  amount, setAmount,
  paidBy, setPaidBy,
  splitType, setSplitType,
  included, setIncluded,
  custom, setCustom,
  onSave, onClear,
}) {
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

  return (
    <form onSubmit={onSave} className="space-y-4">
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
            <button type="button" key={t} onClick={() => setSplitType(t)} aria-pressed={splitType === t}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${splitType === t ? 'border-ink bg-ink text-paper' : 'border-rule bg-white'}`}>
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
                <input aria-label={`Amount for ${m.name}`} inputMode="decimal" placeholder="0"
                  value={custom[m._id] || ''} onChange={(e) => setCustom({ ...custom, [m._id]: e.target.value })}
                  className={`${input} !w-28 !py-1.5 text-right`} />
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
        <button type="button" onClick={onClear} className={btnQuiet}>Clear</button>
      </div>
    </form>
  );
}
