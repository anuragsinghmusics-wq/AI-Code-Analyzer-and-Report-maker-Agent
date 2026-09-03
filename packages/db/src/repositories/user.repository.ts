// packages/db/src/repositories/user.repository.ts — User data access
//
// Rules (rules.md §4.1):
// - All queries through repository functions — no raw Prisma calls elsewhere
// - Always specify `select` — never return the full model
// - Use `findUnique` where you mean unique lookups

import { prisma } from '../client.js';

export type Tier = 'FREE' | 'PRO';

// ── Select shapes ─────────────────────────────────────────────────────

/** Default select: safe for API responses (no token) */
const userSelect = {
  id: true,
  email: true,
  name: true,
  githubId: true,
  tier: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Extended select: includes encrypted token (internal use only) */
const userWithTokenSelect = {
  ...userSelect,
  githubToken: true,
} as const;

// ── Types ─────────────────────────────────────────────────────────────

export type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  githubId: string | null;
  tier: Tier;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithToken = UserRecord & {
  githubToken: string | null;
};

// ── Repository Functions ──────────────────────────────────────────────

/**
 * Find a user by their unique ID.
 * Returns null if not found.
 */
export async function findUserById(id: string): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
  return user ? { ...user, tier: user.tier as Tier } : null;
}

/**
 * Find a user by email address.
 * Returns null if not found.
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: userSelect,
  });
  return user ? { ...user, tier: user.tier as Tier } : null;
}

/**
 * Find a user by GitHub OAuth ID.
 * Returns null if not found.
 */
export async function findUserByGithubId(githubId: string): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({
    where: { githubId },
    select: userSelect,
  });
  return user ? { ...user, tier: user.tier as Tier } : null;
}

/**
 * Find a user by GitHub ID, including their encrypted PAT.
 * Internal use only — never expose this to API responses.
 */
export async function findUserWithToken(githubId: string): Promise<UserWithToken | null> {
  const user = await prisma.user.findUnique({
    where: { githubId },
    select: userWithTokenSelect,
  });
  return user ? { ...user, tier: user.tier as Tier } : null;
}

/**
 * Create a new user via GitHub OAuth.
 */
export async function createUser(data: {
  email: string;
  name?: string;
  githubId: string;
  githubToken?: string;
}): Promise<UserRecord> {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      githubId: data.githubId,
      githubToken: data.githubToken,
    },
    select: userSelect,
  });
  return { ...user, tier: user.tier as Tier };
}

/**
 * Upsert a user from GitHub OAuth callback.
 * Creates if new, updates name/token if existing.
 */
export async function upsertUserFromGithub(data: {
  email: string;
  name?: string;
  githubId: string;
  githubToken?: string;
}): Promise<UserRecord> {
  const user = await prisma.user.upsert({
    where: { githubId: data.githubId },
    create: {
      email: data.email,
      name: data.name,
      githubId: data.githubId,
      githubToken: data.githubToken,
    },
    update: {
      name: data.name,
      githubToken: data.githubToken,
    },
    select: userSelect,
  });
  return { ...user, tier: user.tier as Tier };
}

/**
 * Update a user's GitHub PAT (encrypted).
 */
export async function updateUserToken(
  userId: string,
  encryptedToken: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { githubToken: encryptedToken },
  });
}

/**
 * Update a user's tier (FREE → PRO or vice versa).
 */
export async function updateUserTier(
  userId: string,
  tier: Tier,
): Promise<UserRecord> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { tier },
    select: userSelect,
  });
  return { ...user, tier: user.tier as Tier };
}

/**
 * Delete a user and all their associated data (cascades via schema).
 */
export async function deleteUser(userId: string): Promise<void> {
  await prisma.user.delete({
    where: { id: userId },
  });
}
