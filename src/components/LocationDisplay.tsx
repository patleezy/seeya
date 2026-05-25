interface Props {
  location: string;
}

function isUrl(s: string): boolean {
  return s.startsWith('http://') || s.startsWith('https://');
}

export function LocationDisplay({ location }: Props) {
  if (isUrl(location)) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1.5 flex-wrap">
        📍
        <a
          href={location}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
        >
          View on maps ↗
        </a>
      </p>
    );
  }

  const encoded = encodeURIComponent(location);
  return (
    <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1.5 flex-wrap">
      📍 <span>{location}</span>
      <a
        href={`https://maps.google.com/?q=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs underline underline-offset-2 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
      >
        Google Maps ↗
      </a>
      <a
        href={`https://maps.apple.com/?q=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs underline underline-offset-2 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
      >
        Apple Maps ↗
      </a>
    </p>
  );
}
