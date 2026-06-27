// Shared country flag. Hard (square) corners on the top-left and bottom-right,
// with the top-right and bottom-left rounded. When there's no country code,
// renders an equally-sized empty box if `placeholder` is set (to keep rows
// aligned), otherwise nothing.
export function Flag({
  countryCode,
  className = "h-5 w-5",
  alt = "",
  placeholder = false,
}: {
  countryCode?: string;
  className?: string;
  alt?: string;
  placeholder?: boolean;
}) {
  if (!countryCode) {
    return placeholder ? <div className={`shrink-0 ${className}`} /> : null;
  }
  return (
    <img
      src={`https://api.fifa.com/api/v3/picture/flags-sq-2/${countryCode}`}
      alt={alt}
      className={`shrink-0 rounded-tl-none rounded-tr-md rounded-br-none rounded-bl-md object-cover ${className}`}
    />
  );
}
