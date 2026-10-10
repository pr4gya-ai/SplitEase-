import { btnPrimary, input, label } from './ui.js';

/**
 * The "Describe it" tab: a single text field, a parse button, and error output.
 *
 * Props:
 *   text        – current input string
 *   onChange    – (value: string) => void
 *   onSubmit    – (e) => void   called when the form is submitted
 *   parsing     – boolean       disables the button while a request is in-flight
 *   error       – string | ''   shown below the button
 */
export default function NaturalLanguageInput({ text, onChange, onSubmit, parsing, error }) {
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="nl" className={label}>Type what happened</label>
      <input
        id="nl"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        maxLength={300}
        placeholder="dinner 1200 split with Rahul and Aman"
        className={input}
      />
      <p className="mt-2 text-sm text-ink-soft">
        We fill in the details for you to check. Nothing is saved until you press Save expense.
      </p>
      <button disabled={parsing || !text.trim()} className={`${btnPrimary} mt-4`}>
        {parsing ? 'Reading…' : 'Fill in details'}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-owe">
          {error}
        </p>
      )}
    </form>
  );
}
