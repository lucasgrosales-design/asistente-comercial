import { z } from "zod";

const isoDateTime = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), "invalid_datetime");
const dateOnly = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date").refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "invalid_date");

export const opportunityInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  need: z.string().trim().max(240).optional().nullable(),
  email: z.string().trim().email().max(254).optional().nullable()
}).strict();

export const interactionInputSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  channel: z.string().trim().min(1).max(32).optional(),
  occurred_at: isoDateTime.optional(),
  outcome: z.string().trim().max(160).optional().nullable(),
  next_action: z.string().trim().max(240).optional().nullable(),
  next_action_at: dateOnly.optional().nullable()
}).strict();

export const inboundEventSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  channel: z.string().trim().min(1).max(32),
  sender_id: z.string().trim().min(1).max(160),
  external_message_id: z.string().trim().min(1).max(200),
  sender_name: z.string().trim().max(160).optional().nullable(),
  name: z.string().trim().max(160).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(254).optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  need: z.string().trim().max(240).optional().nullable(),
  product: z.string().trim().max(160).optional().nullable(),
  outcome: z.string().trim().max(160).optional().nullable(),
  received_at: isoDateTime.optional(),
  occurred_at: isoDateTime.optional()
}).strict();

export function requestTooLarge(req: Request, maxBytes = 32768) {
  const length = req.headers.get("content-length");
  return length ? Number(length) > maxBytes : false;
}
