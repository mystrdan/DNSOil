import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for wallet ledger smoke checks.");
}

const pool = new Pool({ connectionString, max: 1 });
const client = await pool.connect();
const suffix = randomUUID();
let validTransactionId: string | undefined;
let validEntryId: string | undefined;

try {
  await client.query("BEGIN");
  const user = await client.query<{ id: string }>(
    "INSERT INTO app_users (email, display_name) VALUES ($1, $2) RETURNING id",
    [`wallet-smoke-${suffix}@example.test`, "Wallet migration smoke test"],
  );
  const userId = user.rows[0]?.id;
  assert.ok(userId, "test user should be inserted");

  const account = await client.query<{ id: string }>(
    "INSERT INTO wallet_accounts (user_id, currency, status) VALUES ($1, 'USD', 'active') RETURNING id",
    [userId],
  );
  const accountId = account.rows[0]?.id;
  assert.ok(accountId, "test wallet account should be inserted");
  await client.query("COMMIT");

  // A balanced debit/credit pair in one currency must commit.
  await client.query("BEGIN");
  const transaction = await client.query<{ id: string }>(
    `INSERT INTO wallet_ledger_transactions (account_id, idempotency_key, source_type, description)
     VALUES ($1, $2, 'smoke-test', 'Balanced ledger test') RETURNING id`,
    [accountId, `balanced-${suffix}`],
  );
  validTransactionId = transaction.rows[0]?.id;
  assert.ok(validTransactionId, "ledger transaction should be inserted");

  const debit = await client.query<{ id: string }>(
    `INSERT INTO wallet_ledger_entries (transaction_id, entry_side, amount_minor, currency)
     VALUES ($1, 'debit', 100, 'USD') RETURNING id`,
    [validTransactionId],
  );
  validEntryId = debit.rows[0]?.id;
  await client.query(
    `INSERT INTO wallet_ledger_entries (transaction_id, entry_side, amount_minor, currency)
     VALUES ($1, 'credit', 100, 'USD')`,
    [validTransactionId],
  );
  await client.query("COMMIT");

  // Deferred checks must reject an unbalanced transaction at commit.
  await client.query("BEGIN");
  const invalid = await client.query<{ id: string }>(
    `INSERT INTO wallet_ledger_transactions (account_id, idempotency_key, source_type, description)
     VALUES ($1, $2, 'smoke-test', 'Unbalanced ledger test') RETURNING id`,
    [accountId, `unbalanced-${suffix}`],
  );
  await client.query(
    `INSERT INTO wallet_ledger_entries (transaction_id, entry_side, amount_minor, currency)
     VALUES ($1, 'debit', 100, 'USD')`,
    [invalid.rows[0]?.id],
  );
  await assert.rejects(client.query("COMMIT"), /balanced debit and credit entries/);
  await client.query("ROLLBACK");

  // Posted transaction metadata and entries must be immutable.
  await client.query("BEGIN");
  await assert.rejects(
    client.query("UPDATE wallet_ledger_transactions SET description = 'tampered' WHERE id = $1", [validTransactionId]),
    /immutable/,
  );
  await client.query("ROLLBACK");

  await client.query("BEGIN");
  await assert.rejects(
    client.query("UPDATE wallet_ledger_entries SET amount_minor = 999 WHERE id = $1", [validEntryId]),
    /immutable/,
  );
  await client.query("ROLLBACK");

  // Currency mismatch must fail the deferred ledger check.
  await client.query("BEGIN");
  const mixed = await client.query<{ id: string }>(
    `INSERT INTO wallet_ledger_transactions (account_id, idempotency_key, source_type, description)
     VALUES ($1, $2, 'smoke-test', 'Currency mismatch test') RETURNING id`,
    [accountId, `mixed-${suffix}`],
  );
  await client.query(
    `INSERT INTO wallet_ledger_entries (transaction_id, entry_side, amount_minor, currency)
     VALUES ($1, 'debit', 100, 'USD')`,
    [mixed.rows[0]?.id],
  );
  await client.query(
    `INSERT INTO wallet_ledger_entries (transaction_id, entry_side, amount_minor, currency)
     VALUES ($1, 'credit', 100, 'EUR')`,
    [mixed.rows[0]?.id],
  );
  await assert.rejects(client.query("COMMIT"), /currency|balanced debit and credit entries/i);
  await client.query("ROLLBACK");

  console.info("Wallet ledger smoke checks passed: balanced entries, imbalance rejection, currency checks, and immutability.");
} finally {
  client.release();
  await pool.end();
}
