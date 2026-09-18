import { useEffect, useState } from "react";
import { formatClock, formatDate, greetingForHour } from "../lib/time";

export function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return {
    now,
    clock: formatClock(now),
    date: formatDate(now),
    greeting: greetingForHour(now.getHours()),
  };
}
