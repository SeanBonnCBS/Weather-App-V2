export default function WeatherlyLogo() {
  return <a className="weatherly-logo" href="#top" aria-label="Weatherly home">
    <svg viewBox="0 0 44 44" aria-hidden="true"><defs><linearGradient id="weatherly-sky" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#5fc4e7"/><stop offset="1" stopColor="#78d8b0"/></linearGradient></defs><rect x="2" y="2" width="40" height="40" rx="13" fill="url(#weatherly-sky)"/><circle cx="29" cy="15" r="6" fill="#fff4a8"/><path d="M8 28c4-5 8-5 12 0 4-5 8-5 15 0" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="3"/><path d="M10 34h24" stroke="#ffffffb8" strokeLinecap="round" strokeWidth="2"/></svg>
    <span>Weatherly</span>
  </a>;
}
