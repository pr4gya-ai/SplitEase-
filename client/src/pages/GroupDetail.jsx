import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import BalanceLedger from '../components/BalanceLedger.jsx';
import PaymentSlip from '../components/PaymentSlip.jsx';
import { formatINR, shortDate } from '../utils/format.js';
import { btnPrimary, input, sectionTitle } from '../components/ui.js';

export default function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const me = { id: user.id, name: user.name };

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [bal, setBal] = useState(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [memberMsg, setMemberMsg] = useState({ text: '', bad: false });

  const load = useCallback(async () => {
    try {
      const [g, e, b] = await Promise.all([api.group(groupId), api.expenses(groupId), api.balances(groupId)]);
      setGroup(g.group);
      setExpenses(e.expenses);
      setBal(b);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const addMember = async (e) => {
    e.preventDefault();
    try {
      await api.addMember(groupId, email);
      setEmail('');
      setMemberMsg({ text: 'Member added.', bad: false });
      await load();
    } catch (err) {
      setMemberMsg({ text: err.message, bad: true });
    }
  };

  const settle = async (p) => {
    try {
      await api.settle(groupId, { from: p.from.id, to: p.to.id, amount: p.amount });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense? Balances will update.')) return;
    try {
      await api.deleteExpense(groupId, id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !group) {
    return (
      <div>
        <p role="alert" className="font-medium text-owe">{error}</p>
        <Link to="/" className="mt-3 inline-block font-bold underline">Back to your groups</Link>
      </div>
    );
  }
  if (!group || !bal) return <p className="text-ink-soft">Loading group…</p>;

  return (
    <div>
      <Link to="/" className="text-sm font-medium text-ink-soft hover:text-ink">All groups</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{group.name}</h1>
          <p className="mt-1 text-ink-soft">{group.members.map((m) => m.name).join(', ')}</p>
        </div>
        <form onSubmit={addMember} className="flex w-full max-w-sm gap-2">
          <label htmlFor="memberEmail" className="sr-only">Add a member by email</label>
          <input id="memberEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@email.com" className={input} />
          <button className={`${btnPrimary} shrink-0`}>Add member</button>
        </form>
      </div>
      {memberMsg.text && (
        <p role="status" className={`mt-2 text-right text-sm font-medium ${memberMsg.bad ? 'text-owe' : 'text-owed'}`}>{memberMsg.text}</p>
      )}
      {error && <p role="alert" className="mt-3 font-medium text-owe">{error}</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="order-2 space-y-10 lg:order-1">
          <section>
            <h2 className={`${sectionTitle} mb-3`}>Add an expense</h2>
            <ExpenseForm group={group} me={me} onSaved={load} />
          </section>

          <section>
            <h2 className={`${sectionTitle} mb-3`}>Expenses</h2>
            {expenses.length === 0 ? (
              <p className="text-ink-soft">No expenses yet. Add the first one above.</p>
            ) : (
              <ul className="divide-y divide-rule border-y border-rule bg-white">
                {expenses.map((x) => (
                  <li key={x._id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="font-bold">{x.description}</p>
                      <p className="text-sm text-ink-soft">
                        {x.paidBy._id === me.id ? 'You' : x.paidBy.name} paid, split {x.splits.length} {x.splits.length === 1 ? 'way' : 'ways'} on {shortDate(x.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatINR(x.amount)}</p>
                      {x.createdBy === me.id && (
                        <button onClick={() => remove(x._id)} className="text-sm text-ink-soft underline hover:text-owe">Delete</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="order-1 space-y-10 lg:order-2">
          <section>
            <h2 className={`${sectionTitle} mb-3`}>Settle up</h2>
            {bal.suggestedPayments.length === 0 ? (
              <p className="text-ink-soft">Everyone is settled up. New expenses will show payments here.</p>
            ) : (
              <ul className="space-y-5">
                {bal.suggestedPayments.map((p, i) => (
                  <PaymentSlip key={`${p.from.id}-${p.to.id}-${p.amount}`} payment={p} me={me} index={i} onSettle={settle} />
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className={`${sectionTitle} mb-3`}>Balances</h2>
            <BalanceLedger balances={bal.balances} me={me} />
          </section>
        </aside>
      </div>
    </div>
  );
}
