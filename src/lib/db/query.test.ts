/* Checks the query builder and Row Level Security against a real Postgres.
   Skipped unless TEST_DATABASE_URL points at a SCRATCH database (it creates
   and deletes rows). Run migrations on it first:
     DATABASE_URL=$TEST_DATABASE_URL node scripts/migrate.mjs
     TEST_DATABASE_URL=... npm test -- db/query */
import assert from "node:assert/strict";

const url = process.env.TEST_DATABASE_URL;
async function main() {
  if (!url) {
    console.log("db/query: skipped (TEST_DATABASE_URL not set)");
    return;
  }
  process.env.DATABASE_URL = url;

  const { adminDb, dbAs } = await import("./index");
  const { sql } = await import("./pool");

  const admin = adminDb();
  const mkUser = async (email: string) =>
    (await sql()<{ id: string }[]>`insert into auth.users (email, encrypted_password, raw_user_meta_data)
       values (${email}, 'x', ${sql().json({ name: "T " + email })}) returning id`)[0].id;

  const tag = `t${Date.now()}`;
  const { data: ca, error: e1 } = await admin.from("clients").insert({ company: `${tag}-A` }).select("id, company").single();
  assert.equal(e1, null);
  assert.equal(ca.company, `${tag}-A`);
  const { data: cb } = await admin.from("clients").insert({ company: `${tag}-B` }).select("id").single();

  const adminId = await mkUser(`${tag}-admin@x.test`);
  const clientId = await mkUser(`${tag}-client@x.test`);
  // signup trigger created the profiles
  const { data: prof } = await admin.from("profiles").select("id, name, role").eq("id", clientId).single();
  assert.equal(prof.role, "client");
  assert.equal(prof.name, `T ${tag}-client@x.test`);
  await admin.from("profiles").update({ role: "admin" }).eq("id", adminId);
  await admin.from("profiles").update({ client_id: ca.id }).eq("id", clientId);

  const { data: pa } = await admin.from("projects").insert({ client_id: ca.id, title: "PA", due_date: "2026-12-01" }).select("*").single();
  assert.equal(pa.stage, "lead");
  assert.equal(pa.due_date, "2026-12-01");
  assert.match(pa.created_at, /^\d{4}-\d\d-\d\dT/);
  await admin.from("projects").insert({ client_id: cb.id, title: "PB" });
  const { data: del } = await admin.from("deliverables").insert({ project_id: pa.id, title: "D1", storage_path: `${ca.id}/x.mp4` }).select("id").single();
  const { data: ver } = await admin.from("review_versions").insert({ deliverable_id: del.id, version: 1, storage_path: `${ca.id}/v1.mp4` }).select("id").single();
  await admin.from("invoices").insert([{ client_id: ca.id, number: `${tag}-1`, amount: 1234.5, due_date: "2020-01-01" }, { client_id: cb.id, number: `${tag}-2`, amount: 10 }]);
  await admin.from("assets").insert({ client_id: ca.id, name: "logo", storage_path: `${ca.id}/l.png`, tags: ["a", "b"] });

  // embeds: many-to-one object, one-to-many array, nested
  const { data: invs } = await admin.from("invoices").select("number, amount, clients(company)").ilike("number", `${tag}%`).order("number");
  assert.equal(invs!.length, 2);
  assert.equal(invs![0].amount, 1234.5);
  assert.deepEqual(invs![0].clients, { company: `${tag}-A` });
  const { data: dl } = await admin.from("deliverables").select("id, title, review_versions(id)").eq("id", del.id).single();
  assert.deepEqual(dl.review_versions, [{ id: ver.id }]);
  const { data: vv } = await admin.from("review_versions").select("id, version, deliverables(id, title, project_id, projects(client_id, title))").eq("id", ver.id).single();
  assert.equal(vv.deliverables.projects.title, "PA");
  const { data: cl } = await admin.from("clients").select("id, company, projects(id)").eq("id", cb.id).single();
  assert.equal(cl.projects.length, 1);

  // filters, count, order
  const { count } = await admin.from("projects").select("id", { count: "exact", head: true }).in("client_id", [ca.id, cb.id]).neq("stage", "completed");
  assert.equal(count, 2);
  const { data: orr } = await admin.from("clients").select("company").or(`company.ilike.%${tag}-a%,company.eq.${tag}-B`).order("company", { ascending: false });
  assert.deepEqual(orr!.map((r) => r.company), [`${tag}-B`, `${tag}-A`]);
  const { data: overdue } = await admin.from("invoices").select("number").lt("due_date", "2021-01-01").ilike("number", `${tag}%`);
  assert.equal(overdue!.length, 1);
  const { data: withDue } = await admin.from("invoices").select("number").not("due_date", "is", null).ilike("number", `${tag}%`);
  assert.equal(withDue!.length, 1);
  const { data: asset } = await admin.from("assets").select("tags").eq("client_id", ca.id).single();
  assert.deepEqual(asset.tags, ["a", "b"]);

  // single / maybeSingle / errors
  const none = await admin.from("clients").select("id").eq("company", "nope-" + tag).maybeSingle();
  assert.equal(none.data, null);
  assert.equal(none.error, null);
  const bad = await admin.from("clients").select("id").eq("company", "nope-" + tag).single();
  assert.equal(bad.error?.code, "PGRST116");
  const missingCol = await admin.from("leads").insert({ name: "x", email: "x@x", nope: 1 });
  assert.equal(missingCol.error?.code, "42703");
  const dup = await admin.from("diagnostic_config").insert({ key: "booking_url", value: "x" });
  assert.equal(dup.error?.code, "23505");

  // upsert / update / delete
  await admin.from("diagnostic_config").upsert([{ key: `${tag}_k`, value: "1" }]);
  await admin.from("diagnostic_config").upsert([{ key: `${tag}_k`, value: "2" }]);
  const { data: cfg } = await admin.from("diagnostic_config").select("value").eq("key", `${tag}_k`).single();
  assert.equal(cfg.value, "2");
  await admin.from("diagnostic_config").delete().eq("key", `${tag}_k`);

  // jsonb + estimate shapes
  const { data: lead } = await admin.from("leads").insert({ name: "L", email: `${tag}@x.test`, estimate: { items: [{ id: "a", qty: 2 }], total: 5 } }).select("id, estimate").single();
  assert.deepEqual(lead.estimate, { items: [{ id: "a", qty: 2 }], total: 5 });

  // ----- Row Level Security -----
  const asClient = dbAs(clientId);
  const { data: myProjects } = await asClient.from("projects").select("id, title").in("client_id", [ca.id, cb.id]);
  assert.deepEqual(myProjects!.map((p) => p.title), ["PA"]);
  const { data: myInvoices } = await asClient.from("invoices").select("number").ilike("number", `${tag}%`);
  assert.equal(myInvoices!.length, 1);
  const { data: noLeads } = await asClient.from("leads").select("id").eq("id", lead.id);
  assert.deepEqual(noLeads, []);
  const denied = await asClient.from("projects").insert({ client_id: ca.id, title: "nope" });
  assert.ok(denied.error, "client must not create projects");
  const okComment = await asClient.from("review_comments").insert({ version_id: ver.id, author: clientId, body: "hi" }).select("id").single();
  assert.equal(okComment.error, null);
  const spoof = await asClient.from("review_comments").insert({ version_id: ver.id, author: adminId, body: "spoof" });
  assert.ok(spoof.error, "client must not post as someone else");
  const asAdmin = dbAs(adminId);
  const { data: all } = await asAdmin.from("projects").select("id").in("client_id", [ca.id, cb.id]);
  assert.equal(all!.length, 2);
  const { data: anonRows } = await dbAs(null).from("clients").select("id").in("id", [ca.id, cb.id]);
  assert.deepEqual(anonRows, []);

  // cleanup
  await admin.from("leads").delete().eq("id", lead.id);
  await admin.from("clients").delete().in("id", [ca.id, cb.id]);
  await sql()`delete from auth.users where id in (${adminId}, ${clientId})`;
  await sql().end();
  console.log("db/query: builder + RLS checks passed ✓");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
