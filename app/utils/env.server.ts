import { cleanEnv, json, str } from "envalid";

const env = cleanEnv(process.env, {
  SESSION_SECRET: str(),
  FIREBASE_SERVICE_ACCOUNT: json(),
  NODE_ENV: str({ choices: ["development", "production"] }),
});

export default env;
