import * as Joi from 'joi';

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

  WX_APP_ID: Joi.string().required(),
  WX_APP_SECRET: Joi.string().required(),

  WXPAY_MCH_ID: Joi.string().required(),
  WXPAY_APP_ID: Joi.string().required(),
  WXPAY_API_V3_KEY: Joi.string().required(),
  WXPAY_NOTIFY_URL: Joi.string().required(),
  WXPAY_REFUND_NOTIFY_URL: Joi.string().required(),
  WXPAY_CERT_SERIAL_NO: Joi.string().required(),
  WXPAY_PRIVATE_KEY_PATH: Joi.string().required(),
  WXPAY_PLATFORM_CERT_PATH: Joi.string().required(),

  SEED_ADMIN_USERNAME: Joi.string().default('admin'),
  SEED_ADMIN_PASSWORD: Joi.string().default('change-me'),
  SEED_ADMIN_DISPLAY_NAME: Joi.string().default('超管'),

  UPLOAD_DRIVER: Joi.string().valid('local', 'cos').default('local'),
});
