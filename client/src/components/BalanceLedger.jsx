import { formatINR } from '../utils/format.js';

export default function BalanceLedger({ balances, me }) {
  return (
    <ul className="divide-y divide-rule border-y border-rule bg-white">
      {balances.map(({ user, net }) => {
        const name = user.id === me.id ? `${user.name} (you)` : user.name;
        const status =
          net > 0
            ? { text: `gets back ${formatINR(net)}`, cls: 'text-owed' }
            : net < 0
            ? { text: `owes ${formatINR(-net)}`, cls: 'text-owe' }
            : { text: 'settled up', cls: 'text-ink-soft' };
        return (
          <li key={user.id} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <span className="font-medium">{name}</span>
            <span className={`text-right font-bold ${status.cls}`}>{status.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
