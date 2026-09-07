export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          border: "1px solid #243044",
          borderRadius: 16,
          padding: "2rem",
          background: "#121a2b",
        }}
      >
        <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>Estado</p>
        <h1 style={{ margin: "0.35rem 0 1rem", fontSize: "1.75rem" }}>
          Fábrica agentes WhatsApp
        </h1>
        <p style={{ margin: "0 0 1rem", lineHeight: 1.5, opacity: 0.9 }}>
          Multi-tenant · Vercel + Supabase + OpenRouter + YCloud
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.7 }}>
          <li>
            Webhook: <code>/api/webhooks/ycloud</code>
          </li>
          <li>
            Migración: <code>supabase/migrations/001_init.sql</code>
          </li>
          <li>
            Aislamiento por <code>client_id</code> / phone number id
          </li>
        </ul>
      </div>
    </main>
  );
}
