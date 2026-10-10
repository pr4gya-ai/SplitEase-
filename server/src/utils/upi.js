// Builds a UPI deep link: upi://pay?pa=<vpa>&pn=<name>&am=<rupees>&cu=INR
// Amount comes in as integer paise and is converted to a 2-decimal rupee string.
function buildUpiLink({ upiId, name, amountPaise, note }) {
  if (!upiId || !Number.isInteger(amountPaise) || amountPaise <= 0) return null;
  const enc = (s) => encodeURIComponent(s).replace(/%40/g, '@');
  const parts = [
    `pa=${enc(upiId)}`,
    name ? `pn=${enc(name)}` : null,
    `am=${(amountPaise / 100).toFixed(2)}`,
    'cu=INR',
    note ? `tn=${enc(note)}` : null,
  ];
  return `upi://pay?${parts.filter(Boolean).join('&')}`;
}

module.exports = { buildUpiLink };
