import { cn } from '@/lib/cn';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toneMap: Record<string, string> = {
  low: 'bg-risk-low/10 text-risk-low border-risk-low/25',
  medium: 'bg-risk-medium/10 text-risk-medium border-risk-medium/25',
  high: 'bg-risk-high/10 text-risk-high border-risk-high/25',
  info: 'bg-trust/10 text-trust border-trust/25',
};

function toneForRisk(r: string | null): keyof typeof toneMap {
  if (r === 'HIGH') return 'high';
  if (r === 'MEDIUM') return 'medium';
  if (r === 'LOW') return 'low';
  return 'info';
}

export type DayEvents = { count: number; risk: string | null };

// Month grid. Day chips are coloured by the highest-risk auction that day.
export function CalendarMonth({
  year,
  month,
  eventsByDay,
  today,
}: {
  year: number;
  month: number; // 0-indexed
  eventsByDay: Record<number, DayEvents>;
  today: Date;
}) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isTodayMonth =
    today.getFullYear() === year && today.getMonth() === month;

  return (
    <>
      <div className="mb-[18px] grid grid-cols-7 gap-3">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-xs font-bold uppercase tracking-[0.08em] text-[#8a97a1]"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {cells.map((d, i) => {
          if (d == null) return <div key={i} className="min-h-[110px] sm:min-h-[140px]" />;
          const ev = eventsByDay[d];
          const isToday = isTodayMonth && today.getDate() === d;
          return (
            <div
              key={i}
              className={cn(
                'flex min-h-[110px] flex-col rounded-xl border bg-surface p-3 sm:min-h-[140px]',
                isToday ? 'border-2 border-trust bg-trust/5' : 'border-line'
              )}
            >
              <div className="mb-2 flex items-start justify-between">
                <span
                  className={cn(
                    isToday ? 'text-[18px] font-bold text-trust' : 'text-[15px] font-semibold text-ink'
                  )}
                >
                  {d}
                </span>
                {isToday && <span className="h-2 w-2 rounded-full bg-trust" />}
              </div>
              {ev && (
                <div
                  className={cn(
                    'mt-auto rounded-md border px-2 py-1 text-[11px] font-semibold',
                    toneMap[toneForRisk(ev.risk)]
                  )}
                >
                  {ev.count} auction{ev.count > 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
