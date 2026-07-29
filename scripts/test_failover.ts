import Module from 'module';
// Mock server-only package for CLI tsx runner
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id: string) {
  if (id === 'server-only') return {};
  return originalRequire.apply(this, arguments as any);
};

import { db } from '@/infrastructure/supabase/db';
import { providerCredentials, aiConversations } from '@/infrastructure/supabase/schema';
import { eq, desc } from 'drizzle-orm';
import { encryptCredentialKey, decryptCredentialKey } from '@/infrastructure/ai/credentialEncryption';
import { createSupabaseProviderCredentialRepository } from '@/infrastructure/repositories/SupabaseProviderCredentialRepository';
import { createSupabaseAiConversationRepository } from '@/infrastructure/repositories/SupabaseAiConversationRepository';
import { CredentialResolver } from '@/infrastructure/ai/CredentialResolver';

async function testFailover() {
  console.log('--- TEST STEP 2: CREDENTIAL FAILOVER ---');
  
  // 1. Get original GLM-5.2 credential
  const [glm52] = await db.select().from(providerCredentials).where(eq(providerCredentials.id, '201ca5c7-ed00-4672-a0ab-66de562c4953'));
  if (!glm52) {
    console.error('GLM-5.2 credential not found');
    return;
  }

  const originalKey = decryptCredentialKey(glm52.encryptedKey);

  // 2. Ensure priority 2 credential (GLM-4.7) exists
  const existing47 = await db.select().from(providerCredentials).where(eq(providerCredentials.label, 'GLM-4.7'));
  let glm47Id: string;

  if (existing47.length === 0) {
    const encryptedKey = encryptCredentialKey(originalKey);
    const [inserted] = await db.insert(providerCredentials).values({
      provider: 'nvidia',
      label: 'GLM-4.7',
      encryptedKey,
      priority: 2,
      modelTier: 'flagship',
      createdBy: glm52.createdBy,
      status: 'active',
    }).returning();
    glm47Id = inserted?.id || '';
    console.log('Inserted GLM-4.7 priority 2 credential:', glm47Id);
  } else {
    glm47Id = existing47[0]!.id;
    await db.update(providerCredentials).set({ status: 'active', priority: 2 }).where(eq(providerCredentials.id, glm47Id));
    console.log('Using existing GLM-4.7 priority 2 credential:', glm47Id);
  }

  // 3. Temporarily invalidate GLM-5.2 credential (invalid key)
  const invalidEncrypted = encryptCredentialKey('nvapi-invalid-key-test-1234567890');
  await db.update(providerCredentials).set({ encryptedKey: invalidEncrypted }).where(eq(providerCredentials.id, glm52.id));
  console.log('Temporarily set GLM-5.2 key to invalid key.');

  // 4. Instantiate CredentialResolver
  const credRepo = (createSupabaseProviderCredentialRepository as any)();
  const convRepo = (createSupabaseAiConversationRepository as any)();
  const resolver = new CredentialResolver({
    credentialRepository: credRepo,
    conversationRepository: convRepo,
    userId: glm52.createdBy,
  });

  // 5. Trigger generation
  let success = false;
  let responseText = '';
  try {
    const res = await resolver.complete('Failover QA Test Prompt - respond with hello', {
      context: { callType: 'content_generation', modelTier: 'flagship' },
    });
    success = true;
    responseText = res.text;
    console.log('Generation completed during failover test!');
    console.log('Response excerpt:', responseText.slice(0, 100));
    console.log('Used Credential ID:', res.credentialId);
  } catch (err: any) {
    console.error('Generation failed during failover:', err.message);
  }

  // 6. Inspect database status of GLM-5.2 credential (circuit breaker check)
  const [glm52After] = await db.select().from(providerCredentials).where(eq(providerCredentials.id, glm52.id));
  console.log('GLM-5.2 Status after attempt:', glm52After?.status);
  console.log('GLM-5.2 Last Error Message:', glm52After?.lastErrorMessage);

  // 7. Restore GLM-5.2 credential to original active state
  await db.update(providerCredentials).set({
    encryptedKey: glm52.encryptedKey,
    status: 'active',
    lastErrorMessage: null,
    lastErrorAt: null,
  }).where(eq(providerCredentials.id, glm52.id));
  console.log('Restored GLM-5.2 credential to original active key and status.');

  console.log('--- FAILOVER TEST COMPLETE ---');
}

testFailover().catch(console.error).finally(() => process.exit());
