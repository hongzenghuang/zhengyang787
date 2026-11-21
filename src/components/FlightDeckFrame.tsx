export function FlightDeckFrame() {
  return (
    <main className="flight-deck-shell">
      <iframe
        className="flight-deck-frame"
        src="/boeing787-simulator.html"
        title="787-10 Flight Deck Simulator"
        allow="fullscreen"
      />
      <a className="flight-deck-open" href="/boeing787-simulator.html">
        Open the standalone simulator
      </a>
    </main>
  );
}
