import * as Joi from 'joi';

// WeChat / WeChat-Pay vars are OPTIONAL for dev — the server boots with just DB+JWT,
// so admin auth & project CRUD (US5) can be tested without merchant credentials.
// WeChat-dependent code paths (US2 mp login, US3 pay/refund) will fail at call time
// until these are filled — which is the desired fail-fast behavior.
const optionalStr = Joi.string().allow('').default('');

export const envValidation = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  WX_APP_ID: optionalStr,
  WX_APP_SECRET: optionalStr,

  WXPAY_MCH_ID: optionalStr,
  WXPAY_APP_ID: optionalStr,
  WXPAY_API_V3_KEY: optionalStr,
  WXPAY_NOTIFY_URL: optionalStr,
  WXPAY_REFUND_NOTIFY_URL: optionalStr,
  WXPAY_CERT_SERIAL_NO: optionalStr,
  WXPAY_PRIVATE_KEY_PATH: optionalStr,
  WXPAY_CERT_PATH: optionalStr,
  WXPAY_PLATFORM_CERT_PATH: optionalStr,

  SEED_ADMIN_USERNAME: Joi.string().default('admin'),
  SEED_ADMIN_PASSWORD: Joi.string().default('change-me'),
  SEED_ADMIN_DISPLAY_NAME: Joi.string().default('超管'),

  UPLOAD_DRIVER: Joi.string().valid('local', 'cos').default('local'),
});
