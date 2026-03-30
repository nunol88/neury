import type { Task } from '@/hooks/useAgendamentos';

function formatICSDate(dateStr: string, time: string): string {
  // dateStr format: "YYYY-MM-DD", time format: "HH:MM"
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = time.split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@neury.app`;
}

export function generateICSFile(tasks: Task[], monthLabel: string): string {
  const events = tasks.map(task => {
    const lines: string[] = [
      'BEGIN:VEVENT',
      `UID:${generateUID()}`,
      `DTSTART:${formatICSDate(task.date, task.startTime)}`,
      `DTEND:${formatICSDate(task.date, task.endTime)}`,
      `SUMMARY:${escapeICS(task.client)}`,
    ];

    if (task.address) {
      lines.push(`LOCATION:${escapeICS(task.address)}`);
    }

    const descParts: string[] = [];
    if (task.phone) descParts.push(`Tel: ${task.phone}`);
    if (task.notes) descParts.push(task.notes);
    if (descParts.length > 0) {
      lines.push(`DESCRIPTION:${escapeICS(descParts.join('\\n'))}`);
    }

    lines.push('END:VEVENT');
    return lines.join('\r\n');
  });

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Neury//Agendamentos//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Agendamentos ${monthLabel}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return calendar;
}

export function downloadICSFile(tasks: Task[], monthLabel: string): void {
  if (tasks.length === 0) return;

  const icsContent = generateICSFile(tasks, monthLabel);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const sanitizedLabel = monthLabel.toLowerCase().replace(/\s+/g, '-');
  const link = document.createElement('a');
  link.href = url;
  link.download = `agendamentos-${sanitizedLabel}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
