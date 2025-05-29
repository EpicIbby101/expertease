import config from '@/config';

const requiredEnvVars = {
  auth: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
  payments: [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_STRIPE_PRODUCT_1_PRICE_ID',
  ],
  email: ['PLUNK_API_KEY'],
  ratelimit: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
} as const;

function checkEnvVars(feature: keyof typeof requiredEnvVars): boolean {
  const vars = requiredEnvVars[feature];
  return vars.every((envVar) => {
    const value = process.env[envVar];
    return value !== undefined && value !== '';
  });
}

export function validateConfig() {
  Object.entries(config).forEach(([feature, settings]) => {
    if (
      feature in requiredEnvVars &&
      settings.enabled &&
      !checkEnvVars(feature as keyof typeof requiredEnvVars)
    ) {
      const missingVars = requiredEnvVars[feature as keyof typeof requiredEnvVars]
        .filter((envVar) => !process.env[envVar])
        .join(', ');

      console.error(
        `${feature} is enabled in config but missing required environment variables: ${missingVars}. ` +
          `Please add them to your .env or .env.local file.`
      );

      // Disable the feature
      (config as any)[feature].enabled = false;
    }
  });
}
