import { Hono, MiddlewareHandler } from "https://deno.land/x/hono/mod.ts";
import { logger } from "https://deno.land/x/hono/middleware/logger/index.ts";
import { z } from "https://deno.land/x/zod/mod.ts";

const EnvSchema = z.object({
  DENO_KV_URL: z.string().min(1, { message: "env:DENO_KV_URL is required" }),
  TODO_EXPIRE_DAYS_COMPLETED: z.coerce.number().default(30),
  DEBUG: z.coerce.boolean().default(false),
});
const env = EnvSchema.parse(Deno.env.toObject());
console.log("env: ", env);

const kv = await Deno.openKv(env.DENO_KV_URL);
const app = new Hono();

const TodoSchema = z.object({
  id: z.string().max(64).default(""),
  completed: z.boolean().default(false),
  content: z.string().min(1),
  createdAt: z.coerce.date().default(new Date()),
  updatedAt: z.coerce.date().or(z.undefined()),
  deletedAt: z.coerce.date().or(z.undefined()),
  tags: z.array(z.string()).or(z.undefined()),
});

const bodyLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      console.log("req: ", await c.req.json());
    } catch (_) {
      console.log("req: no body");
    }
    await next();
    console.log("res: ", await c.res.json());
  };
};
if (env.DEBUG) {
  app.use("*", bodyLogger());
}
app.use("*", logger());

app.get("/", (c) => c.text("healthy"));

app.post("/api/todos", async (c) => {
  const body = await c.req.json();

  try {
    const todo = TodoSchema.parse(body);
    todo.id = crypto.randomUUID();
    const res = await kv.set(["todo", todo.id], todo);
    console.log(res);
    return c.json({ "message": "Successfully added new TODO", "item": todo });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json({ "error": JSON.parse(e.message) }, 400);
    } else {
      return c.json({ "error": e.message }, 500);
    }
  }
});

app.get("/api/todos", async (c) => {
  const entries = await kv.list({ prefix: ["todo"] });

  const todos = [];
  for await (const entry of entries) {
    todos.push(entry.value);
  }
  return c.json({ "items": todos });
});

app.get("/api/todos/:id", async (c) => {
  const id = c.req.param("id");
  const { value } = await kv.get(["todo", id]);
  if (value === null) return c.json({ "id": id, "error": "not found" }, 404);
  return c.json({ "item": value });
});

app.delete("/api/todos/:id", async (c) => {
  const id = c.req.param("id");
  const { value } = await kv.get(["todo", id]);
  if (value === null) return c.json({ "id": id, "error": "not found" }, 404);
  await kv.delete(["todo", id]);
  return c.json({ "message": "Successfully deleted TODO", "item": value });
});

app.put("/api/todos/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  try {
    const todo = TodoSchema.parse(body);
    if (todo.id !== id) {
      return c.json({ "error": "invalid ID" }, 400);
    }
    todo.updatedAt = new Date();
    const res = await kv.set(["todo", todo.id], todo);
    console.log(res);
    return c.json({ "message": "Successfully updated TODO", "item": todo });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json({ "error": JSON.parse(e.message) }, 400);
    } else {
      return c.json({ "error": e.message }, 500);
    }
  }
});

Deno.serve(app.fetch);
