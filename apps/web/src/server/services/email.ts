import {
  type CreateEmailOptions,
  type CreateEmailRequestOptions,
  Resend,
} from "resend";

import { env } from "@/env/server";

const resend = new Resend(env.RESEND_API_KEY);

export function sendEmail(
  payload: CreateEmailOptions,
  options?: CreateEmailRequestOptions,
) {
  return resend.emails.send(payload, options);
}
