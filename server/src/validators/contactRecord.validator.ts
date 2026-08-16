import { z } from "zod";

// Customer and Supplier are the same shape (name/email/phone/address/notes)
// - this factory is the single place that shape is defined, so the two
// modules can't silently drift apart. Each module still gets its own
// generated schema/type names for clarity at the call site.
//
// `phoneRequired` defaults to false so the existing Supplier call site
// (`buildContactRecordSchemas()`, no args) keeps its current optional-phone
// behavior untouched. Customer opts in with `{ phoneRequired: true }` per
// its own validation spec, without forking the shared shape.
// `extraShape` lets a caller (e.g. Customer, adding `creditLimit`) merge
// extra fields into both the create and update object schemas *before* the
// update schema's `.refine()` is applied - z.ZodEffects (the type `.refine`
// returns) can't be `.extend()`-ed afterwards, so this is the one place to
// add fields, rather than every call site reaching into schema internals.
export function buildContactRecordSchemas(
  options: { phoneRequired?: boolean; extraCreateShape?: z.ZodRawShape; extraUpdateShape?: z.ZodRawShape } = {}
) {
  const { phoneRequired = false, extraCreateShape = {}, extraUpdateShape = {} } = options;

  const phoneSchema = phoneRequired
    ? z.string().trim().min(1, "Phone is required").max(30)
    : z.string().trim().max(30).nullable().optional();

  const create = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
    email: z.string().trim().toLowerCase().email("Please enter a valid email address").nullable().optional(),
    phone: phoneSchema,
    address: z.string().trim().max(500).nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    ...extraCreateShape
  });

  const update = z
    .object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(200).optional(),
      email: z.string().trim().toLowerCase().email("Please enter a valid email address").nullable().optional(),
      // On update, an omitted phone just means "not changing it" - phone
      // being *required* only governs "can it be blanked out", which the
      // non-nullable phoneSchema above already enforces once provided.
      phone: phoneRequired ? z.string().trim().min(1, "Phone is required").max(30).optional() : phoneSchema,
      address: z.string().trim().max(500).nullable().optional(),
      notes: z.string().trim().max(1000).nullable().optional(),
      isActive: z.boolean().optional(),
      ...extraUpdateShape
    })
    .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

  return { create, update };
}
