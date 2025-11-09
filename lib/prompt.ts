export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin';

export type BuildInput = {
  topic: string;
  audience: string;
  tone: 'friendly' | 'professional' | 'motivational' | 'educational' | 'persuasive' | 'humorous';
  platforms: Platform[];
  variations: number;
  durationMinutes?: number;
};

export function buildMessages(input: BuildInput) {
  const { topic, audience, tone, platforms, variations, durationMinutes } = input;
  const system = `You are an expert scriptwriter and social media content creator. You produce clear, concise, high-impact scripts and platform-tailored social posts with strong hooks and calls-to-action. Always optimize for readability and engagement.`;

  const jsonSpec = `Return ONLY strict JSON with this exact shape: { "script": { "title": string, "outline": string[], "body": string }, "posts": { "facebook"?: string[], "instagram"?: string[], "twitter"?: string[], "linkedin"?: string[] } }`;

  const audiencePart = audience ? `Target audience: ${audience}.` : '';
  const durationPart = durationMinutes ? `Aim for a video duration of about ${durationMinutes} minutes.` : '';

  const user = `Topic: ${topic}\n${audiencePart}\nTone: ${tone}.\nPlatforms: ${platforms.join(', ')}.\nVariations per platform: ${variations}.\n${durationPart}\n\nInstructions:\n1) Write a compelling video/presentation script: title, 4-8 bullet outline, and a body of 250-600 words with a strong hook, value, and a clear call-to-action.\n2) Create ${variations} short, platform-optimized social posts per selected platform. Include a persuasive hook, relevant keywords, and a light CTA (e.g., comment, share). Use platform norms:\n   - Facebook: conversational, 1-3 short paragraphs.\n   - Instagram: concise caption with 3-6 relevant hashtags.\n   - Twitter: <= 280 chars, crisp and punchy; no long hashtags.\n   - LinkedIn: professional tone, 2-4 short lines with whitespace.\n\n${jsonSpec}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ] as const;
}
