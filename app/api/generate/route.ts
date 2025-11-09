import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildMessages } from '../../../lib/prompt';
import { generateFromLLM, fallbackGenerate } from '../../../lib/generate';

const BodySchema = z.object({
  topic: z.string().min(4),
  audience: z.string().optional().default(''),
  tone: z.enum(['friendly','professional','motivational','educational','persuasive','humorous']).default('friendly'),
  platforms: z.array(z.enum(['facebook','instagram','twitter','linkedin'])).min(1),
  variations: z.number().int().min(1).max(6).default(3),
  durationMinutes: z.number().int().min(1).max(30).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);

    const messages = buildMessages({
      topic: body.topic,
      audience: body.audience ?? '',
      tone: body.tone,
      platforms: body.platforms,
      variations: body.variations,
      durationMinutes: body.durationMinutes,
    });

    const hasKey = Boolean(process.env.OPENAI_API_KEY);

    const result = hasKey
      ? await generateFromLLM(messages)
      : await fallbackGenerate({
          topic: body.topic,
          audience: body.audience ?? '',
          tone: body.tone,
          platforms: body.platforms,
          variations: body.variations,
          durationMinutes: body.durationMinutes,
        });

    return NextResponse.json(result);
  } catch (err: any) {
    const message = err?.message ?? 'Invalid request';
    return new NextResponse(message, { status: 400 });
  }
}
