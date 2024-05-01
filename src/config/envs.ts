import 'dotenv/config';
import * as Joi from 'joi';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET_KEY: string;
  STRIPE_SUCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  STRIPE_ENDPOINT_SECRET: string;
  NATS_SERVERS: string[];
}

const validationSchema = Joi.object({
  PORT: Joi.number().required(),
  STRIPE_SECRET_KEY: Joi.string().required(),
  NATS_SERVERS: Joi.array().items(Joi.string()).required(),
}).unknown(true);

const { error, value } = validationSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS.split(','),
});

if (error) {
  throw new Error(`Env file validation error: ${error}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  stripeSecretKey: envVars.STRIPE_SECRET_KEY,
  stripeSucessUrl: envVars.STRIPE_SUCESS_URL,
  stripeCancelurl: envVars.STRIPE_CANCEL_URL,
  stripeEndpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
  natsServers: envVars.NATS_SERVERS,
};
