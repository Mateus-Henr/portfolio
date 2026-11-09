/*
  Round flags for the language switch, drawn here so they look the same on
  every system (Windows shows flag emoji as two letters). Each flag is a
  square drawing that CSS crops to a circle (.flag in features.css).
*/

/** The United States: stripes and the blue canton with a few stars. */
function UnitedStates() {
  const stripe = 32 / 13;
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" fill="#ffffff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={i * stripe} width="32" height={stripe} fill="#b22234" />
      ))}
      <rect width="15.5" height={stripe * 7} fill="#3c3b6e" />
      {[5.5, 9, 12.5].flatMap((x) =>
        [5, 9, 13].map((y) => <circle key={`${x}-${y}`} cx={x + (y === 9 ? 1.75 : 0)} cy={y} r="0.95" fill="#ffffff" />),
      )}
    </svg>
  );
}

/** Brazil: the yellow diamond and the blue globe with its white band. */
function Brazil() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" fill="#009c3b" />
      <path d="M16 4.5 L29.5 16 L16 27.5 L2.5 16 Z" fill="#ffdf00" />
      <circle cx="16" cy="16" r="6.6" fill="#002776" />
      <path d="M9.7 15.2 Q16 12.9 22.4 15.6" fill="none" stroke="#ffffff" strokeWidth="1.4" />
    </svg>
  );
}

export function Flag({ country }: { country: 'us' | 'br' }) {
  return <span className="flag">{country === 'us' ? <UnitedStates /> : <Brazil />}</span>;
}
