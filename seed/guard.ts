/**
 * Seeding a production database needs an explicit opt-in (demo servers only):
 * SEED_ALLOW_PROD=true, or --allow-prod when the runner forwards CLI args
 * (`payload run` does not forward extra arguments, so Docker uses the env var).
 */
export function canSeed(
  env: { NODE_ENV?: string; SEED_ALLOW_PROD?: string },
  argv: readonly string[],
): boolean {
  return (
    env.NODE_ENV !== 'production' || env.SEED_ALLOW_PROD === 'true' || argv.includes('--allow-prod')
  )
}
