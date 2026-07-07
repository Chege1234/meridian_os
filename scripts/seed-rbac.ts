import './load-env';

import { db } from '@/infrastructure/supabase/db';
import { roles, permissions, rolePermissions } from '@/infrastructure/supabase/schema';
import { eq } from 'drizzle-orm';

const SYSTEM_ROLES = [
  { name: 'owner', description: 'System role with full access to all features and settings', isSystem: true },
  { name: 'admin', description: 'System role for managing operations and content', isSystem: true },
  { name: 'editor', description: 'System role for creating and editing content and assets', isSystem: true },
  { name: 'viewer', description: 'System role with read-only access to all modules', isSystem: true },
];

const MODULE_ACTIONS: Record<string, string[]> = {
  'crm': ['create', 'read', 'update', 'delete'],
  'contacts': ['create', 'read', 'update', 'delete'],
  'contact': ['create', 'read', 'update', 'delete'],
  'campaigns': ['create', 'read', 'update', 'delete', 'transition'],
  'campaign': ['create', 'read', 'update', 'delete', 'transition'],
  'content-studio': ['create', 'read', 'update', 'delete', 'approve', 'publish', 'transition'],
  'content': ['create', 'read', 'update', 'delete', 'approve', 'publish', 'transition'],
  'prompt-library': ['create', 'read', 'update', 'delete', 'edit'],
  'prompt': ['create', 'read', 'update', 'delete', 'edit'],
  'prompts': ['create', 'read', 'update', 'delete', 'edit'],
  'analytics': ['create', 'read', 'update', 'delete', 'view', 'export'],
  'media-library': ['create', 'read', 'update', 'delete', 'upload'],
  'media': ['create', 'read', 'update', 'delete', 'upload'],
  'brand-center': ['create', 'read', 'update', 'delete'],
  'brand': ['create', 'read', 'update', 'delete'],
  'knowledge-base': ['create', 'read', 'update', 'delete', 'publish', 'transition'],
  'kb': ['create', 'read', 'update', 'delete', 'publish', 'transition'],
  'document': ['create', 'read', 'update', 'delete', 'publish', 'transition'],
  'sops': ['create', 'read', 'update', 'delete', 'publish', 'transition'],
  'sop': ['create', 'read', 'update', 'delete', 'publish', 'transition'],
  'automation': ['create', 'read', 'update', 'delete', 'approve', 'reject'],
  'automations': ['create', 'read', 'update', 'delete', 'approve', 'reject'],
  'agents': ['create', 'read', 'update', 'delete', 'approve', 'reject', 'execute'],
  'agent': ['create', 'read', 'update', 'delete', 'approve', 'reject', 'execute'],
  'settings': ['read', 'update', 'manage'],
  'users': ['create', 'read', 'update', 'delete', 'manage', 'manage-owners', 'invite'],
  'user': ['create', 'read', 'update', 'delete', 'manage', 'manage-owners', 'invite']
};

function getPermissionList() {
  const list: { name: string; module: string; description: string }[] = [];
  for (const [moduleName, actions] of Object.entries(MODULE_ACTIONS)) {
    for (const action of actions) {
      list.push({
        name: `${moduleName}.${action}`,
        module: moduleName,
        description: `Allows ${action} action on ${moduleName} module`
      });
    }
  }
  return list;
}

const EDITOR_MODULES = new Set([
  'content', 'content-studio',
  'campaign', 'campaigns',
  'crm', 'contacts', 'contact',
  'media', 'media-library',
  'prompt', 'prompts', 'prompt-library',
  'kb', 'knowledge-base', 'document',
  'sop', 'sops'
]);

function shouldAssignToRole(roleName: string, permissionName: string): boolean {
  if (roleName === 'owner') {
    return true;
  }

  if (roleName === 'admin') {
    // Exclude settings.manage and users.manage-owners / user.manage-owners (BR-104)
    return (
      permissionName !== 'settings.manage' &&
      permissionName !== 'users.manage-owners' &&
      permissionName !== 'user.manage-owners'
    );
  }

  if (roleName === 'editor') {
    const parts = permissionName.split('.');
    if (parts.length !== 2) return false;
    const [moduleName, action] = parts;
    
    // Editor gets create, read, update on allowed modules (BR-105)
    return (
      EDITOR_MODULES.has(moduleName || '') &&
      (action === 'create' || action === 'read' || action === 'update')
    );
  }

  if (roleName === 'viewer') {
    const parts = permissionName.split('.');
    if (parts.length !== 2) return false;
    const [, action] = parts;
    
    // Viewer gets read-only access (BR-106)
    return action === 'read' || action === 'view';
  }

  return false;
}

async function seed() {
  console.log('Starting RBAC database seed...');

  try {
    // 1. Seed Roles
    console.log('Seeding roles...');
    for (const roleObj of SYSTEM_ROLES) {
      await db.insert(roles)
        .values({
          name: roleObj.name,
          description: roleObj.description,
          isSystem: roleObj.isSystem,
        })
        .onConflictDoNothing();
    }

    // Retrieve seeded roles to get their database IDs
    const allRoles = await db.select().from(roles);
    const roleMap = new Map(allRoles.map((r) => [r.name, r.id]));

    // Verify system roles were created successfully
    for (const roleObj of SYSTEM_ROLES) {
      if (!roleMap.has(roleObj.name)) {
        throw new Error(`Failed to find/create role: ${roleObj.name}`);
      }
    }

    // 2. Seed Permissions
    console.log('Seeding permissions...');
    const permissionList = getPermissionList();
    for (const permObj of permissionList) {
      await db.insert(permissions)
        .values({
          name: permObj.name,
          module: permObj.module,
          description: permObj.description,
        })
        .onConflictDoNothing();
    }

    // Retrieve seeded permissions to get their database IDs
    const allPermissions = await db.select().from(permissions);
    const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]));

    // 3. Build and seed mappings
    console.log('Mapping role permissions...');
    const rolePermissionValues: { roleId: string; permissionId: string }[] = [];

    for (const [roleName, roleId] of roleMap.entries()) {
      for (const [permName, permId] of permissionMap.entries()) {
        if (shouldAssignToRole(roleName, permName)) {
          rolePermissionValues.push({
            roleId,
            permissionId: permId,
          });
        }
      }
    }

    // Batch insert mappings to be efficient, using onConflictDoNothing
    console.log(`Inserting ${rolePermissionValues.length} role-permission mappings...`);
    // Batch in chunks to prevent database payload limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < rolePermissionValues.length; i += CHUNK_SIZE) {
      const chunk = rolePermissionValues.slice(i, i + CHUNK_SIZE);
      await db.insert(rolePermissions)
        .values(chunk)
        .onConflictDoNothing();
    }

    console.log('RBAC database seeding completed successfully!');

    // 4. Print Summary Table
    console.log('\n--- RBAC Summary Table ---');
    console.log('+----------------------+------------------+');
    console.log('| Role                 | Permission Count |');
    console.log('+----------------------+------------------+');

    const counts: Record<string, number> = {};
    for (const roleObj of SYSTEM_ROLES) {
      const roleId = roleMap.get(roleObj.name);
      if (roleId) {
        const mappings = await db.select()
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, roleId));
        counts[roleObj.name] = mappings.length;
      } else {
        counts[roleObj.name] = 0;
      }
      
      const roleNameFormatted = roleObj.name.padEnd(20);
      const countFormatted = String(counts[roleObj.name]).padStart(16);
      console.log(`| ${roleNameFormatted} | ${countFormatted} |`);
    }
    console.log('+----------------------+------------------+');

  } catch (error) {
    console.error('Error during RBAC seeding:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
