import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

/**
 * Parses an ISO date string from the server (which may lack a timezone offset),
 * correctly treating it as UTC and converting it to the client's local time.
 */
export const parseAsUtc = (isoString: string | null | undefined): dayjs.Dayjs | null => {
  if (!isoString) return null;
  const cleanStr = isoString.trim();
  // Check if string already has 'Z' or timezone offset like +00:00 or -05:00
  const hasTimezone = /[zZ]$|[+-]\d{2}(?::?\d{2})?$/.test(cleanStr);
  const utcStr = hasTimezone ? cleanStr : `${cleanStr}Z`;
  const parsed = dayjs.utc(utcStr);
  return parsed.isValid() ? parsed.local() : null;
};

/**
 * Formats a message timestamp into 12-hour local time (e.g. "8:41 PM").
 */
export const formatMessageTime = (isoString: string | null | undefined): string => {
  const d = parseAsUtc(isoString);
  if (!d) return "";
  return d.format("h:mm A");
};

/**
 * Formats a conversation's last message time into relative time
 * (e.g. "Just now", "5m ago", "2h ago", "Yesterday", "Oct 12").
 */
export const formatMessageRelativeTime = (isoString: string | null | undefined): string => {
  const d = parseAsUtc(isoString);
  if (!d) return "";

  const now = dayjs();
  const diffMins = now.diff(d, "minute");
  const diffHours = now.diff(d, "hour");
  const diffDays = now.diff(d, "day");

  // Accommodate slight local vs server clock skew of a few seconds
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.format("MMM D");
};
