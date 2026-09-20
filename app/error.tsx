"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="container"><section className="card" style={{ maxWidth: 620, margin: "40px auto" }}><h1 style={{ marginTop: 0 }}>No pudimos cargar esta pantalla</h1><p className="muted">La aplicación sigue disponible. Podés intentar nuevamente sin perder tus datos.</p><div className="actions"><button className="button" onClick={() => reset()}>Intentar nuevamente</button><a className="button secondary" href="/">Ir al inicio</a></div></section></main>;
}
