-- Every wallet account must have a matching customer-liability ledger account.
CREATE OR REPLACE FUNCTION dnsoil_create_customer_wallet_ledger_account()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO wallet_ledger_accounts (wallet_account_id, account_key, account_type, currency)
  VALUES (NEW.id, 'customer_wallet', 'liability', NEW.currency)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER wallet_account_create_ledger_account
AFTER INSERT ON wallet_accounts
FOR EACH ROW EXECUTE FUNCTION dnsoil_create_customer_wallet_ledger_account();

-- Repair any account that predates the trigger or was missed during an interrupted rollout.
INSERT INTO wallet_ledger_accounts (wallet_account_id, account_key, account_type, currency)
SELECT wa.id, 'customer_wallet', 'liability', wa.currency
FROM wallet_accounts wa
ON CONFLICT DO NOTHING;
