"use client";
import { useMemo, useState } from "react";

type Platform = "facebook" | "instagram" | "twitter" | "linkedin";

type GenerateResponse = {
  script: { title: string; body: string; outline?: string[] };
  posts: Partial<Record<Platform, string[]>>;
};

const allPlatforms: { id: Platform; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
];

export default function Page() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("friendly");
  const [variations, setVariations] = useState(3);
  const [platforms, setPlatforms] = useState<Platform[]>(["twitter", "linkedin"]);
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GenerateResponse | null>(null);

  const canSubmit = useMemo(() => topic.trim().length > 3 && platforms.length > 0 && !loading, [topic, platforms, loading]);

  const togglePlatform = (id: Platform) => {
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, tone, platforms, variations, durationMinutes: durationMinutes === "" ? undefined : Number(durationMinutes) }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as GenerateResponse;
      setData(json);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo" />
        <div className="title">AI Script & Social Generator</div>
      </div>

      <form className="card" onSubmit={onSubmit}>
        <div className="grid">
          <div>
            <label className="label">Topic</label>
            <textarea className="textarea" placeholder="e.g., Practical tips to reduce meeting overload in remote teams" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div>
            <label className="label">Target audience (optional)</label>
            <input className="input" placeholder="e.g., engineering managers, creators, teachers" value={audience} onChange={(e) => setAudience(e.target.value)} />

            <label className="label" style={{ marginTop: 12 }}>Tone</label>
            <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="motivational">Motivational</option>
              <option value="educational">Educational</option>
              <option value="persuasive">Persuasive</option>
              <option value="humorous">Humorous</option>
            </select>

            <label className="label" style={{ marginTop: 12 }}>Estimated video duration (minutes, optional)</label>
            <input className="input" type="number" min={1} max={30} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))} />

            <label className="label" style={{ marginTop: 12 }}>Number of post variations</label>
            <input className="input" type="number" min={1} max={6} value={variations} onChange={(e) => setVariations(Number(e.target.value))} />
          </div>
        </div>

        <div className="label" style={{ marginTop: 8 }}>Platforms</div>
        <div className="row">
          {allPlatforms.map((p) => (
            <label className="badge" key={p.id}>
              <input type="checkbox" checked={platforms.includes(p.id)} onChange={() => togglePlatform(p.id)} />
              {p.label}
            </label>
          ))}
        </div>

        <div className="actions">
          <button className={`button primary`} type="submit" disabled={!canSubmit}>{loading ? "Generating..." : "Generate"}</button>
          <button className="button" type="button" onClick={() => { setTopic(""); setAudience(""); setTone("friendly"); setPlatforms(["twitter", "linkedin"]); setVariations(3); setDurationMinutes(""); setData(null); setError(null); }}>Reset</button>
        </div>

        {!process.env.NEXT_PUBLIC_OPENAI_PRESENT && (
          <div className="small" style={{ marginTop: 10 }}>Tip: Set <span className="mono">OPENAI_API_KEY</span> in project settings for higher-quality results.</div>
        )}
      </form>

      {error && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-title">Error</div>
          <div className="result">{error}</div>
        </div>
      )}

      {data && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-title">Script</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>{data.script.title}</div>
            <button className="copy" onClick={() => copy(`# ${data.script.title}\n\n${(data.script.outline ?? []).map((o, i) => `${i+1}. ${o}`).join("\n")}\n\n${data.script.body}`)}>Copy Script</button>
          </div>
          {data.script.outline && data.script.outline.length > 0 && (
            <div className="small" style={{ marginTop: 6 }}>Outline: {data.script.outline.join(" ? ")}</div>
          )}
          <div className="result" style={{ marginTop: 10 }}>{data.script.body}</div>

          <div className="section-title">Social Posts</div>
          {allPlatforms.map((p) => (
            data.posts[p.id] && data.posts[p.id]!.length > 0 ? (
              <div key={p.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 700 }}>{p.label}</div>
                  <button className="copy" onClick={() => copy(data.posts[p.id]!.join("\n\n"))}>Copy All</button>
                </div>
                {data.posts[p.id]!.map((post, idx) => (
                  <div key={idx} className="result" style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div className="small">Variation {idx + 1}</div>
                      <button className="copy" onClick={() => copy(post)}>Copy</button>
                    </div>
                    <div style={{ marginTop: 8 }}>{post}</div>
                  </div>
                ))}
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
}
