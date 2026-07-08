export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "60px auto", fontFamily: "system-ui", lineHeight: 1.6 }}>
      <h1>Job Pipeline MCP</h1>
      <p>
        This is an MCP server, not a browsable app. Point an MCP client at:
      </p>
      <pre style={{ background: "#f4f4f4", padding: 12, borderRadius: 6 }}>
        {"<this-deployment-url>/api/mcp"}
      </pre>
      <p>Tools exposed:</p>
      <ul>
        <li><code>generate_resume</code> — one page LaTeX resume tailored to a JD</li>
        <li><code>generate_cover_letter</code> — one page LaTeX cover letter tailored to a JD</li>
        <li><code>save_application</code> — logs a job to the tracker (no submission)</li>
        <li><code>list_applications</code> — reads back the tracker</li>
        <li><code>get_profile</code> — returns the structured profile data used for generation</li>
      </ul>
      <p>
        <strong>One time setup:</strong> this project needs a Vercel Blob store connected
        for <code>save_application</code> / <code>list_applications</code> to persist data.
        In the Vercel dashboard: Storage tab to create a Blob store, then connect it to
        this project so <code>BLOB_READ_WRITE_TOKEN</code> is set automatically.
        The generate tools work with no setup.
      </p>
      <p>
        Edit <code>lib/profile.ts</code> directly whenever experience, projects, or skills change.
        That file is the single source of truth for everything this server generates.
      </p>
    </main>
  );
}
