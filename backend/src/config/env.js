const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  MONGO_URI: z.string({
    required_error: 'MONGO_URI is required',
  }).min(1, 'MONGO_URI cannot be empty'),
  JWT_ACCESS_SECRET: z.string({
    required_error: 'JWT_ACCESS_SECRET is required',
  }).min(16, 'JWT_ACCESS_SECRET must be at least 16 characters long'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string({
    required_error: 'JWT_REFRESH_SECRET is required',
  }).min(16, 'JWT_REFRESH_SECRET must be at least 16 characters long'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
  RESET_PASSWORD_EXPIRES_MIN: z.coerce.number().default(15),
  RESET_PASSWORD_URL: z.string().default('http://localhost:3000/reset-password'),
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('OrbitBill <noreply@orbitbill.com>'),
  SEED_ADMIN_NAME: z.string().default('Super Admin'),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@orbitbill.com'),
  SEED_ADMIN_PASSWORD: z.string().min(9).default('Admin@12345'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
  DEFAULT_PAYMENT_TERMS_DAYS: z.coerce.number().default(15),
  SUBSCRIPTION_CRON_SCHEDULE: z.string().default('30 0 * * *'),
  SWAGGER_ENABLED: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true' || val === '1';
    }
    return Boolean(val);
  }, z.boolean().default(true)),
});

// Fallback for MONGODB_URI if MONGO_URI is not provided directly
const rawEnv = {
  ...process.env,
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`\n❌ Environment variable validation failed:\n${issues}\n`);
  process.exit(1);
}

const env = parsed.data;

module.exports = env;
