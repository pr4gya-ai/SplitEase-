import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { btnPrimary, btnQuiet, input, label, sectionTitle } from '../components/ui.js';

function UpiSettings() {
  const { user, setUser } = useAuth();
  const [upi, setUpi] = useState(user.upiId || '');
  const [msg, setMsg] = useState('');
  const save = async (e) => {
    e.preventDefault();
    try {
      const r = await api.saveUpi(upi.trim());
      setUser(r.user);
      setMsg('UPI ID saved.');
    } catch (err) {
      setMsg(err.message);
    }
  };
  return (
    <form onSubmit={save} className="rounded-lg bg-white p-5 ring-1 ring-rule">
      <h2 className="text-lg font-extrabold tracking-tight">Your UPI ID</h2>
      <p className="mt-1 text-sm text-ink-soft">Friends use it to pay you straight from the settle-up screen.</p>
      <label htmlFor="upiId" className={`${label} mt-4`}>UPI ID</label>
      <input id="upiId" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" className={input} />
      <div className="mt-3 flex items-center gap-3">
        <button className={btnQuiet}>Save</button>
        <span role="status" className="text-sm text-ink-soft">{msg}</span>
      </div>
    </form>
  );
}

export default function Groups() {
  const [groups, setGroups] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.groups().then((r) => setGroups(r.groups)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.createGroup(name);
      setName('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <section>
        <h1 className="text-4xl font-extrabold tracking-tight">Your groups</h1>
        <form onSubmit={create} className="mt-6 flex gap-2">
          <label htmlFor="gname" className="sr-only">Group name</label>
          <input id="gname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Goa trip, Flat 302…" className={input} />
          <button disabled={busy || !name.trim()} className={`${btnPrimary} shrink-0`}>Create group</button>
        </form>
        {error && <p role="alert" className="mt-2 text-sm font-medium text-owe">{error}</p>}

        {groups === null ? (
          <p className="mt-8 text-ink-soft">Loading groups…</p>
        ) : groups.length === 0 ? (
          <p className="mt-8 text-ink-soft">No groups yet. Name one above to start splitting expenses.</p>
        ) : (
          <ul className="mt-8 divide-y divide-rule border-y border-rule bg-white">
            {groups.map((g) => (
              <li key={g._id}>
                <Link to={`/groups/${g._id}`} className="flex items-baseline justify-between gap-4 px-4 py-4 hover:bg-paper-deep">
                  <span className="text-lg font-bold">{g.name}</span>
                  <span className="truncate text-sm text-ink-soft">{g.members.map((m) => m.name.split(' ')[0]).join(', ')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <aside><UpiSettings /></aside>
    </div>
  );
}
