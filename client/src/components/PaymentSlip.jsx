import { useState } from 'react';
import { formatINR } from '../utils/format.js';
import { btnQuiet, btnSaffron } from './ui.js';

// The one memorable element: a payment slip with perforated notches.
export default function PaymentSlip({ payment, me, onSettle, index }) {
  const [busy, setBusy] = useState(false);
  const youPay = payment.from.id === me.id;
  const youReceive = payment.to.id === me.id;
  const headline = youPay
    ? `You pay ${payment.to.name}`
    : youReceive
    ? `${payment.from.name} pays you`
    : `${payment.from.name} pays ${payment.to.name}`;

  const settle = async () => {
    setBusy(true);
    try {
      await onSettle(payment);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className="relative animate-slip-in rounded-lg bg-white ring-1 ring-rule"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="px-5 pb-4 pt-5">
        <p className="text-sm font-medium text-ink-soft">{headline}</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">{formatINR(payment.amount)}</p>
      </div>

      <div className="relative border-t-2 border-dashed border-rule px-5 py-4">
        <span aria-hidden className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-paper" />
        <span aria-hidden className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-paper" />
        <div className="flex flex-wrap items-center gap-2">
          {youPay && payment.upiLink && (
            <a href={payment.upiLink} className={btnSaffron}>Pay with UPI</a>
          )}
          <button onClick={settle} disabled={busy} className={btnQuiet}>
            {busy ? 'Saving…' : youReceive ? 'Mark as received' : 'Mark as paid'}
          </button>
        </div>
        {youPay && !payment.upiLink && (
          <p className="mt-2 text-sm text-ink-soft">
            {payment.to.name} has not added a UPI ID yet. Pay them another way, then mark it as paid.
          </p>
        )}
      </div>
    </li>
  );
}
