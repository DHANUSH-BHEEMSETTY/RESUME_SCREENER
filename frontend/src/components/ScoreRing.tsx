import { cn } from './Badge';

export function ScoreRing({
  score,
  size = 'md',
  className
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const radius = size === 'sm' ? 16 : size === 'md' ? 24 : 36;
  const stroke = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'text-emerald-500';
  if (score < 50) colorClass = 'text-rose-500';
  else if (score < 75) colorClass = 'text-amber-500';

  const dimClass = size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-16 h-16' : 'w-24 h-24';
  const textClass = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base' : 'text-xl';

  return (
    <div className={cn("relative flex items-center justify-center", dimClass, className)}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 drop-shadow-md"
      >
        {/* Background ring */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-slate-800"
        />
        {/* Progress ring */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={cn("transition-all duration-1000 ease-out", colorClass)}
        />
      </svg>
      <div className={cn("absolute font-bold text-white", textClass)}>
        {Math.round(score)}
      </div>
    </div>
  );
}
