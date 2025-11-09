import OpenAI from 'openai';
import type { BuildInput, Platform } from './prompt';

export async function generateFromLLM(messages: ReadonlyArray<{ role: 'system' | 'user'; content: string }>) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages as any,
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });
  const content = resp.choices[0]?.message?.content ?? '{}';
  return JSON.parse(content);
}

export async function fallbackGenerate(input: BuildInput) {
  const { topic, audience, tone, platforms, variations, durationMinutes } = input;
  const title = catchyTitle(topic, tone);
  const outline = makeOutline(topic);
  const body = makeBody(topic, audience, tone, durationMinutes);
  const posts: Partial<Record<Platform, string[]>> = {};
  for (const p of platforms) {
    posts[p] = Array.from({ length: variations }, (_, i) => makePost(p, topic, tone, i));
  }
  return { script: { title, outline, body }, posts };
}

function catchyTitle(topic: string, tone: string): string {
  const prefix = {
    friendly: 'Let\'s Talk:',
    professional: 'Executive Brief:',
    motivational: 'You Got This:',
    educational: 'How To:',
    persuasive: 'Why Now:',
    humorous: 'Real Talk:',
  } as Record<string, string>;
  return `${prefix[tone] ?? 'Guide:'} ${topic.replace(/\.$/, '')}`;
}

function makeOutline(topic: string): string[] {
  return [
    'Hook the viewer with a vivid benefit',
    `Define the challenge in ${topic.toLowerCase()}`,
    '3-5 practical, actionable steps',
    'Address one common objection',
    'Summarize key takeaway in one line',
    'End with a specific call-to-action',
  ];
}

function makeBody(topic: string, audience: string, tone: string, duration?: number): string {
  const est = duration ? ` (~${duration} min)` : '';
  const aud = audience ? ` for ${audience}` : '';
  const style = toneStyle(tone);
  return [
    `${style.hook} ${topic}.`,
    `If you${aud}, you\'ve probably felt this: the gap between knowing and doing. Today, let\'s close it with a handful of concrete steps you can apply immediately.`,
    '1) Clarify the outcome: write the one sentence result you want.\n2) Reduce friction: remove one blocker before you begin.\n3) Timebox: set a short window to move, not to perfect.\n4) Reflect: capture one lesson you\'ll reuse next time.',
    'Common objection: "I don\'t have time." Counter: start with a 5-minute slice. Momentum beats perfect timing.',
    `Takeaway: small consistent actions compound fast. Start today; your future self will thank you${aud}.`,
    `CTA: Comment with your first step and share this with someone who needs a nudge. ${est}`,
  ].join('\n\n');
}

function toneStyle(tone: string) {
  switch (tone) {
    case 'professional':
      return { hook: 'In brief,' };
    case 'motivational':
      return { hook: 'You are closer than you think to' };
    case 'educational':
      return { hook: 'Quick lesson:' };
    case 'persuasive':
      return { hook: 'Here\'s the case for' };
    case 'humorous':
      return { hook: 'Confession time?let\'s laugh our way through' };
    default:
      return { hook: 'Let\'s unpack' };
  }
}

function makePost(platform: Platform, topic: string, tone: string, i: number): string {
  const cta = {
    facebook: '?? Tell me your #1 takeaway',
    instagram: 'Save + share if this helped',
    twitter: 'RT to help someone today',
    linkedin: 'Comment your perspective?let\'s compare notes',
  }[platform];

  const base = postfixTone(shortHook(topic), tone);

  if (platform === 'twitter') {
    const post = `${base} | Action > ideas. What\'s one step you\'ll take today?`; // <= 280
    return `${post} ? ${cta}`;
  }

  if (platform === 'instagram') {
    return `${base}\n\n${cta}\n\n#${slug(topic)} #productivity #creators #learning #mindset #growth`;
  }

  if (platform === 'linkedin') {
    return `${base}\n\n? Context matters?start small\n? Remove friction before you begin\n? Reflect and reuse lessons\n\n${cta}`;
  }

  // facebook
  return `${base}\n\nThe gap between knowing and doing? Shrink it today with one small, specific action. Share yours below.\n\n${cta}`;
}

function shortHook(topic: string): string {
  const clean = topic.replace(/\s+/g, ' ').trim();
  return `Strong results, simple moves: ${clean}`;
}

function postfixTone(text: string, tone: string) {
  const suffix = {
    professional: '',
    motivational: '?you\'re closer than you think',
    educational: ' (quick lesson)',
    persuasive: ' (here\'s why it works)',
    humorous: ' (yes, even on Mondays)',
    friendly: '',
  } as Record<string, string>;
  return `${text}${suffix[tone] ?? ''}`;
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
