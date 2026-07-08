import './load-env';

import { createClient } from '@supabase/supabase-js';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/infrastructure/supabase/db';
import { providerCredentials, brandGuidelines, brandAssets, prompts } from '@/infrastructure/supabase/schema';

import {
  createSupabaseBrandAssetRepository,
  createSupabaseBrandGuidelineRepository,
} from '@/infrastructure/repositories/SupabaseBrandRepository';
import { createSupabasePromptRepository } from '@/infrastructure/repositories/SupabasePromptRepository';
import { createSupabaseActivityLogRepository } from '@/infrastructure/repositories/SupabaseActivityLogRepository';


import { publishBrandGuideline } from '@/features/brand-center/application/PublishBrandGuideline';
import { createBrandAsset } from '@/features/brand-center/application/CreateBrandAsset';
import { createPrompt } from '@/features/prompt-library/application/CreatePrompt';

async function main() {
  console.log('Starting Brand and Prompts Seeding script...');

  // 1. Retrieve Owner User ID from environment variables
  const authorId = process.env.SEED_OWNER_USER_ID;
  if (!authorId) {
    console.error('Error: SEED_OWNER_USER_ID environment variable is missing.');
    console.error('Please configure it in your .env or .env.local file.');
    process.exit(1);
  }
  console.log(`Using owner user ID for seeding: ${authorId}`);

  // 2. Setup Supabase Client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase environment variables are missing (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  // 3. Setup repositories
  const brandAssetRepository = createSupabaseBrandAssetRepository(supabase);
  const brandGuidelineRepository = createSupabaseBrandGuidelineRepository(supabase);
  const promptRepository = createSupabasePromptRepository(supabase);
  const activityLogRepository = createSupabaseActivityLogRepository(supabase);

  try {
    // 4. Resolve configured AI provider from database
    const activeCredentials = await db
      .select()
      .from(providerCredentials)
      .where(and(eq(providerCredentials.status, 'active'), isNull(providerCredentials.deletedAt)));

    let selectedProvider: 'openai' | 'anthropic' | 'google' | 'nvidia' = 'openai';
    if (activeCredentials.length > 0) {
      selectedProvider = activeCredentials[0].provider as any;
      console.log(`Resolved configured AI provider: ${selectedProvider}`);
    } else {
      console.log(`No active provider credentials found in provider_credentials. Defaulting prompts to 'openai'.`);
    }

    // 5. Seed BRAND GUIDELINE
    const guidelineTitle = 'CampusMarket Brand Guidelines';
    const guidelineContent = `# CampusMarket Brand Guidelines

## Brand Identity & Naming
- **Canonical Brand Name**: CampusMarket
- **Acceptable Long-form Variant**: Campus Marketplace
- **Rule**: Never invert this priority (always prefer CampusMarket).

## Tagline
"The premier student-to-student marketplace. Buy, sell, and trade safely within your university community."

## Positioning
CampusMarket is a student-to-student marketplace for verified .edu.tr students and staff across North Cyprus. The platform focuses on trading items such as books, electronics, and furniture.

## Voice & Tone
- **Voice**: Plain, direct, safety-first. Not playful or marketing-heavy.
- **Model Tone Examples**:
  - "Your safety is our top priority."
  - "Always meet in public, well-lit areas."
  - "These rules keep CampusMarket safe and fair for everyone."

## Do's
- Use short, declarative sentences.
- Include safety reminders where relevant.
- Use concrete specifics over vague marketing language. For example, listing descriptions should read like spec sheets: "Stewart Calculus: Early Transcendentals, 9th Edition. Perfect condition."

## Don'ts
- Do not use hype language.
- Do not use fabricated urgency.
- Never imply transactions are guaranteed safe without the standard safety caveat.`;

    const existingGuidelines = await db
      .select()
      .from(brandGuidelines)
      .where(eq(brandGuidelines.title, guidelineTitle));

    if (existingGuidelines.length === 0) {
      console.log('Seeding Brand Guideline...');
      const publishResult = await publishBrandGuideline(
        {
          title: guidelineTitle,
          content: guidelineContent,
          authorId: authorId,
        },
        { brandGuidelineRepository, activityLogRepository }
      );
      if (!publishResult.success) {
        throw new Error(`Failed to publish brand guideline: ${publishResult.error}`);
      }
      console.log(`Brand Guideline published successfully as v1.`);
    } else {
      console.log('Brand Guideline already exists. Skipping publication.');
    }

    // 6. Seed BRAND ASSETS
    // a) Color Palette
    const paletteName = 'CampusMarket Core Palette';
    const existingPalette = await db
      .select()
      .from(brandAssets)
      .where(and(eq(brandAssets.name, paletteName), isNull(brandAssets.deletedAt)));

    if (existingPalette.length === 0) {
      console.log('Seeding Brand Asset: CampusMarket Core Palette...');
      const paletteResult = await createBrandAsset(
        {
          type: 'color_palette',
          name: paletteName,
          value: {
            colors: [
              { name: 'Primary', hex: '#1a7f64' },
              { name: 'Primary Hover', hex: '#15664f' },
              { name: 'Primary Tint', hex: '#e6f5f0' },
              { name: 'Secondary', hex: '#e8850c' },
              { name: 'Secondary Hover', hex: '#cf7409' },
              { name: 'Accent', hex: '#d63c4a' },
              { name: 'Background', hex: '#f5f3f0' },
              { name: 'Surface', hex: '#ffffff' },
              { name: 'Text', hex: '#1c1917' },
              { name: 'Text Muted', hex: '#78716c' },
              { name: 'Border', hex: '#e7e5e4' },
              { name: 'Success', hex: '#16a34a' },
              { name: 'Warning', hex: '#d97706' },
              { name: 'Error', hex: '#dc2626' }
            ]
          },
          description: 'Note this is the light-mode palette; dark-mode equivalents exist (#34d399, #2ab383, #1a3a2e, #fbbf24, #f59e0b, #1c1917 bg, #fafaf9 text) but are out of scope for v1 brand asset seeding — add as a follow-up if Content Studio needs dark-mode-aware generation later.',
          createdBy: authorId,
        },
        { brandAssetRepository, activityLogRepository }
      );
      if (!paletteResult.success) {
        throw new Error(`Failed to create brand asset: ${paletteResult.error}`);
      }
      console.log(`Brand Asset: "${paletteName}" created successfully.`);
    } else {
      console.log(`Brand Asset: "${paletteName}" already exists. Skipping.`);
    }

    // b) Body Font
    const bodyFontName = 'CampusMarket Body';
    const existingBodyFont = await db
      .select()
      .from(brandAssets)
      .where(and(eq(brandAssets.name, bodyFontName), isNull(brandAssets.deletedAt)));

    if (existingBodyFont.length === 0) {
      console.log('Seeding Brand Asset: CampusMarket Body Font...');
      const fontResult = await createBrandAsset(
        {
          type: 'font',
          name: bodyFontName,
          value: {
            family: 'Inter',
            weights: [300, 400, 500, 600, 700],
            url: 'Google Fonts',
          },
          createdBy: authorId,
        },
        { brandAssetRepository, activityLogRepository }
      );
      if (!fontResult.success) {
        throw new Error(`Failed to create body font brand asset: ${fontResult.error}`);
      }
      console.log(`Brand Asset: "${bodyFontName}" created successfully.`);
    } else {
      console.log(`Brand Asset: "${bodyFontName}" already exists. Skipping.`);
    }

    // c) Headings Font
    const headingsFontName = 'CampusMarket Headings';
    const existingHeadingsFont = await db
      .select()
      .from(brandAssets)
      .where(and(eq(brandAssets.name, headingsFontName), isNull(brandAssets.deletedAt)));

    if (existingHeadingsFont.length === 0) {
      console.log('Seeding Brand Asset: CampusMarket Headings Font...');
      const fontResult = await createBrandAsset(
        {
          type: 'font',
          name: headingsFontName,
          value: {
            family: 'Outfit',
            weights: [400, 500, 600, 700, 800],
            url: 'Google Fonts',
          },
          createdBy: authorId,
        },
        { brandAssetRepository, activityLogRepository }
      );
      if (!fontResult.success) {
        throw new Error(`Failed to create headings font brand asset: ${fontResult.error}`);
      }
      console.log(`Brand Asset: "${headingsFontName}" created successfully.`);
    } else {
      console.log(`Brand Asset: "${headingsFontName}" already exists. Skipping.`);
    }

    // 7. Seed PROMPT LIBRARY (5 starter prompts)
    const promptsToSeed = [
      {
        title: 'Marketplace Listing Description',
        description: 'Generate listing descriptions formatted as a spec sheet without marketing hype.',
        prompt: `You are an AI writing assistant for CampusMarket (formerly Campus Marketplace).
Create a marketplace listing description for an item with the following details:
- Item Name: {itemName}
- Condition: {condition}
- Key Details: {keyDetails}
- Price: {price}
- Currency: {currency} (Note: Currency may be TRY, GBP, or USD. Format it clearly, e.g. $50, 50 TRY, or £50).

Format the output in a plain, direct, spec-sheet style. Avoid marketing hype, buzzwords, or fabricated urgency. Keep sentences short and declarative. Include standard safety caveats if appropriate.`,
        variables: ['itemName', 'condition', 'keyDetails', 'price', 'currency']
      },
      {
        title: 'Safety Reminder Snippet',
        description: 'Generate standard safety reminder snippets matching the safety guidelines.',
        prompt: `Generate a short, plain safety reminder snippet to insert into emails or listing pages for CampusMarket.
It must match the official Safety Guidelines page tone. Do not use marketing jargon. Keep it direct and focused on user safety.
Example references:
"Your safety is our top priority. Always meet in public, well-lit areas."`,
        variables: []
      },
      {
        title: 'Transactional Email Copy',
        description: 'Generate transactional email copy with a clear CTA and minimal fluff.',
        prompt: `Generate transactional email copy for CampusMarket for the event type: {eventType}.
The tone should be direct, minimal, and clear. Model it on the confirmation-email tone, e.g.:
"Thanks for signing up. Click the button below to verify your email."
Include exactly one clear Call to Action (CTA). Avoid any promotional or marketing fluff.`,
        variables: ['eventType']
      },
      {
        title: 'Community Rule Reminder Post',
        description: 'Generate short community rule reminder posts focused on safe transactions.',
        prompt: `Generate a short community rule reminder post for CampusMarket (social or in-app notification).
It must be short-form and grounded in real Community Rules, emphasizing safe transactions.
Example:
"Do not send money before seeing the item unless you fully trust the other user."
Keep the tone plain, direct, and safety-focused.`,
        variables: []
      },
      {
        title: 'SEO Meta Description',
        description: 'Generate sitewide default pattern SEO meta descriptions.',
        prompt: `Create a search engine optimization (SEO) meta description for the following page topic: {pageTopic}.
It must match the CampusMarket sitewide default pattern:
"Buy and sell [items] with verified .edu.tr students and staff across North Cyprus."
Ensure it is under 160 characters, direct, and includes the location (North Cyprus) and verification (.edu.tr).`,
        variables: ['pageTopic']
      }
    ];

    for (const p of promptsToSeed) {
      const existingPrompt = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.title, p.title), isNull(prompts.deletedAt)));

      if (existingPrompt.length === 0) {
        console.log(`Seeding Prompt: "${p.title}"...`);
        const promptResult = await createPrompt(
          {
            title: p.title,
            description: p.description,
            prompt: p.prompt,
            variables: p.variables,
            provider: selectedProvider,
            createdBy: authorId,
            status: 'active',
          },
          { promptRepository, activityLogRepository }
        );
        if (!promptResult.success) {
          throw new Error(`Failed to create prompt "${p.title}": ${promptResult.error}`);
        }
        console.log(`Prompt: "${p.title}" created successfully.`);
      } else {
        console.log(`Prompt: "${p.title}" already exists. Skipping.`);
      }
    }

    // 8. Output detailed execution summary and requested warning line
    console.log('\n--- SEEDING RUN COMPLETED ---');
    console.log('Seeded brand guideline: CampusMarket Brand Guidelines (v1)');
    console.log('Seeded brand assets: CampusMarket Core Palette, CampusMarket Body, CampusMarket Headings');
    console.log('Seeded starter prompts: Marketplace Listing Description, Safety Reminder Snippet, Transactional Email Copy, Community Rule Reminder Post, SEO Meta Description');
    console.log('No logo asset seeded — upload the real CampusMarket logo through Media Library, then create a logo brand asset manually or ask for a follow-up script.');
    console.log('-----------------------------\n');

  } catch (error) {
    console.error('Error during seeding operation:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
