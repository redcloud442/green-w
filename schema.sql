
DELETE FROM storage.buckets;
CREATE POLICY buckets_policy ON storage.buckets FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name) VALUES ('REQUEST_ATTACHMENTS', 'REQUEST_ATTACHMENTS');

CREATE EXTENSION IF NOT EXISTS plv8;

CREATE OR REPLACE FUNCTION get_current_date()
RETURNS TIMESTAMPTZ
SET search_path TO ''
AS $$
BEGIN
  RETURN NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_error_post(input_data JSON)
RETURNS VOID
AS $$
  const { error_message, function_name, stack_trace, stack_path } = input_data;

  plv8.execute(
    `
    INSERT INTO error_schema.error_table (
      error_message,
      error_function_name,
      error_stack_trace,
      error_stack_path
    ) VALUES ($1, $2, $3, $4)
    `,
    [error_message, function_name, stack_trace, stack_path]
  );
$$ LANGUAGE plv8;


ALTER TABLE user_schema.user_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow CREATE for authenticated users" ON user_schema.user_table;
CREATE POLICY "Allow CREATE for authenticated users" ON user_schema.user_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow READ for anon users" ON user_schema.user_table;
CREATE POLICY "Allow READ for anon users" ON user_schema.user_table
AS PERMISSIVE FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow UPDATE for authenticated users" ON user_schema.user_table;
CREATE POLICY "Allow UPDATE for authenticated users"
ON user_schema.user_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('ADMIN', 'MERCHANT', 'ACCOUNTING', 'MEMBER')
  )
);

ALTER TABLE alliance_schema.alliance_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for anon users" ON alliance_schema.alliance_table;
CREATE POLICY "Allow READ for anon users" ON alliance_schema.alliance_table
AS PERMISSIVE FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('ADMIN', 'MERCHANT', 'ACCOUNTING', 'MEMBER')
  )
);

-- for alliance member table
ALTER TABLE alliance_schema.alliance_member_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for anon users" ON alliance_schema.alliance_member_table;
CREATE POLICY "Allow READ for anon users" ON alliance_schema.alliance_member_table
AS PERMISSIVE FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow Insert for anon users" ON alliance_schema.alliance_member_table;
CREATE POLICY "Allow Insert for anon users" ON alliance_schema.alliance_member_table
AS PERMISSIVE FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('ADMIN', 'MERCHANT', 'ACCOUNTING', 'MEMBER')
  )
);

DROP POLICY IF EXISTS "Allow UPDATE for authenticated users with ADMIN role" ON alliance_schema.alliance_member_table;
CREATE POLICY "Allow UPDATE for authenticated users with ADMIN role" ON alliance_schema.alliance_member_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  alliance_member_id IN (
    SELECT alliance_member_user_id FROM alliance_schema.alliance_table
    WHERE alliance_member_user_id = (SELECT auth.uid())
    AND alliance_member_role IN ('ADMIN')
  )
);


-- for alliance earnings table
-- Enable Row-Level Security
ALTER TABLE alliance_schema.alliance_earnings_table ENABLE ROW LEVEL SECURITY;

-- Allow READ for authenticated users (restricted to their data or admins)
DROP POLICY IF EXISTS "Allow READ for authenticated users" ON alliance_schema.alliance_earnings_table;
CREATE POLICY "Allow READ for authenticated users" ON alliance_schema.alliance_earnings_table
AS PERMISSIVE FOR SELECT 
TO authenticated
USING (
    alliance_earnings_member_id IN (
        SELECT alliance_member_id
        FROM alliance_schema.alliance_member_table
        WHERE alliance_member_user_id = auth.uid()
        AND alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
    )
);

-- Allow INSERT for authenticated users (restricted to their data only)
DROP POLICY IF EXISTS "Allow Insert for authenticated users" ON alliance_schema.alliance_earnings_table;
CREATE POLICY "Allow Insert for authenticated users" ON alliance_schema.alliance_earnings_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
    alliance_earnings_member_id IN (
        SELECT alliance_member_id
        FROM alliance_schema.alliance_member_table
        WHERE alliance_member_user_id = auth.uid()
        AND alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
    )
);

-- Allow UPDATE for authenticated users (restricted to their data or admins)
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users" ON alliance_schema.alliance_earnings_table;
CREATE POLICY "Allow UPDATE for authenticated users" ON alliance_schema.alliance_earnings_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
    alliance_earnings_member_id IN (
        SELECT alliance_member_id
        FROM alliance_schema.alliance_member_table
        WHERE alliance_member_user_id = auth.uid()
        AND alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
    )
)
WITH CHECK (
    alliance_earnings_member_id IN (
        SELECT alliance_member_id
        FROM alliance_schema.alliance_member_table
        WHERE alliance_member_user_id = auth.uid()
        AND alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
    )
);

-- Allow ALL for admins
DROP POLICY IF EXISTS "Allow ALL for admins" ON alliance_schema.alliance_earnings_table;
CREATE POLICY "Allow ALL for admins" ON alliance_schema.alliance_earnings_table
AS PERMISSIVE FOR ALL
TO authenticated
USING (
    alliance_earnings_member_id IN (
        SELECT alliance_member_id
        FROM alliance_schema.alliance_member_table
        WHERE alliance_member_user_id = auth.uid()
        AND alliance_member_role = 'ADMIN'
    )
);

-- for alliance referral link table
ALTER TABLE alliance_schema.alliance_referral_link_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for authenticated users" ON alliance_schema.alliance_referral_link_table;
CREATE POLICY "Allow READ for authenticated users" ON alliance_schema.alliance_referral_link_table
AS PERMISSIVE FOR SELECT 
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow Insert for authenticated users" ON alliance_schema.alliance_referral_link_table;
CREATE POLICY "Allow Insert for authenticated users" ON alliance_schema.alliance_referral_link_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- for alliance referral table  
ALTER TABLE alliance_schema.alliance_referral_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for authenticated users" ON alliance_schema.alliance_referral_table;
CREATE POLICY "Allow READ for authenticated users" ON alliance_schema.alliance_referral_table
AS PERMISSIVE FOR SELECT 
TO authenticated
USING (true);


DROP POLICY IF EXISTS "Allow Insert for anon users" ON alliance_schema.alliance_referral_table;
CREATE POLICY "Allow Insert for anon users" ON alliance_schema.alliance_referral_table
AS PERMISSIVE FOR INSERT
WITH CHECK (true);


DROP POLICY IF EXISTS "Allow update for anon users" ON alliance_schema.alliance_referral_table;
CREATE POLICY "Allow update for anon users" ON alliance_schema.alliance_referral_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true);


ALTER TABLE alliance_schema.alliance_withdrawal_request_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for authenticated users" ON alliance_schema.alliance_withdrawal_request_table;
CREATE POLICY "Allow READ for anon users" ON alliance_schema.alliance_withdrawal_request_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "Allow Insert for authenticated users" ON alliance_schema.alliance_withdrawal_request_table;
CREATE POLICY "Allow Insert for anon users" ON alliance_schema.alliance_withdrawal_request_table
AS PERMISSIVE FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
  )
);


CREATE POLICY "Allow UPDATE for authenticated users with ACCOUNTING role" 
ON alliance_schema.alliance_withdrawal_request_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_table at
    JOIN alliance_schema.alliance_member_table ab
      ON ab.alliance_member_alliance_id = at.alliance_id 
    WHERE ab.alliance_member_user_id = auth.uid()
    AND ab.alliance_member_role = 'ACCOUNTING'
  )
);

ALTER TABLE user_schema.user_history_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All for anon users" ON user_schema.user_history_log;
CREATE POLICY "Allow All for anon users" ON user_schema.user_history_log
AS PERMISSIVE FOR ALL


ALTER TABLE packages_schema.package_ally_bounty_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for authenticated users" ON packages_schema.package_ally_bounty_log;
CREATE POLICY "Allow READ for anon users" ON packages_schema.package_ally_bounty_log
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "Allow Insert for authenticated users" ON packages_schema.package_ally_bounty_log;
CREATE POLICY "Allow Insert for anon users" ON packages_schema.package_ally_bounty_log
AS PERMISSIVE FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
  )
);

ALTER TABLE packages_schema.package_earnings_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for authenticated users" ON packages_schema.package_earnings_log;
CREATE POLICY "Allow READ for anon users" ON packages_schema.package_earnings_log
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "Allow Insert for authenticated users" ON packages_schema.package_earnings_log;
CREATE POLICY "Allow Insert for anon users" ON packages_schema.package_earnings_log
AS PERMISSIVE FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
  )
);

-- Enable Row Level Security (RLS) for the table
ALTER TABLE packages_schema.package_member_connection_table ENABLE ROW LEVEL SECURITY;

-- Create READ policy: Allow authenticated users to read only their own data
CREATE POLICY "Allow READ for authenticated users" 
ON packages_schema.package_member_connection_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table am
    WHERE am.alliance_member_id = package_member_member_id
      AND am.alliance_member_user_id = auth.uid()
  )
);

-- Create INSERT policy: Allow authenticated users to insert data associated with their own user ID
CREATE POLICY "Allow INSERT for authenticated users" 
ON packages_schema.package_member_connection_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table am
    WHERE am.alliance_member_id = package_member_member_id
      AND am.alliance_member_user_id = auth.uid()
  )
);

-- Create UPDATE policy: Allow authenticated users to update only their own data
CREATE POLICY "Allow UPDATE for authenticated users" 
ON packages_schema.package_member_connection_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table am
    WHERE am.alliance_member_id = package_member_member_id
      AND am.alliance_member_user_id = auth.uid()
  )
);


ALTER TABLE packages_schema.package_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for authenticated users" ON packages_schema.package_table;
CREATE POLICY "Allow READ for anon users" ON packages_schema.package_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "Allow Insert for authenticated users" ON packages_schema.package_table;
CREATE POLICY "Allow Insert for authenticated users" ON packages_schema.package_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('ADMIN')
  )
);

DROP POLICY IF EXISTS "Allow Update for authenticated users" ON packages_schema.package_table;
CREATE POLICY "Allow Update for authenticated users" ON packages_schema.package_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('ADMIN')
  )
);






DROP POLICY IF EXISTS "Allow INSERT for authenticated users with ADMIN role" ON packages_schema.package_table;


CREATE POLICY "Allow INSERT for authenticated users with ADMIN role" 
ON packages_schema.package_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_table at
    JOIN alliance_schema.alliance_member_table ab
      ON ab.alliance_member_alliance_id = at.alliance_id 
    WHERE ab.alliance_member_user_id = auth.uid()
    AND ab.alliance_member_role = 'ADMIN'
  )
);


CREATE POLICY "Allow UPDATE for authenticated users with ADMIN role" 
ON packages_schema.package_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_table at
    JOIN alliance_schema.alliance_member_table ab
      ON ab.alliance_member_alliance_id = at.alliance_id 
    WHERE ab.alliance_member_user_id = auth.uid()
    AND ab.alliance_member_role = 'ADMIN'
  )
);



ALTER TABLE alliance_schema.alliance_top_up_request_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for authenticated users" ON alliance_schema.alliance_top_up_request_table;
CREATE POLICY "Allow READ for anon users" ON alliance_schema.alliance_top_up_request_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
  )
);

DROP POLICY IF EXISTS "Allow Insert for authenticated users" ON alliance_schema.alliance_top_up_request_table;
CREATE POLICY "Allow Insert for anon users" ON alliance_schema.alliance_top_up_request_table
AS PERMISSIVE FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('MEMBER', 'MERCHANT', 'ACCOUNTING', 'ADMIN')
  )
);

CREATE POLICY "Allow UPDATE for authenticated users with MERCHANT role" 
ON alliance_schema.alliance_top_up_request_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_table at
    JOIN alliance_schema.alliance_member_table ab
      ON ab.alliance_member_alliance_id = at.alliance_id -- Corrected the join condition
    WHERE ab.alliance_member_user_id = auth.uid()
    AND ab.alliance_member_role IN ('MERCHANT','ADMIN')
  )
);


-- for package table
-- Enable Row Level Security
ALTER TABLE packages_schema.package_table ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for authenticated users
DROP POLICY IF EXISTS "Allow SELECT for authenticated users" ON packages_schema.package_table;
CREATE POLICY "Allow SELECT for authenticated users" ON packages_schema.package_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Allow UPDATE for ADMIN users
DROP POLICY IF EXISTS "Allow UPDATE for ADMIN users" ON packages_schema.package_table;
CREATE POLICY "Allow UPDATE for ADMIN users" ON packages_schema.package_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = (SELECT auth.uid())
      AND amt.alliance_member_role = 'ADMIN'
  )
);

-- Allow INSERT for ADMIN users
DROP POLICY IF EXISTS "Allow INSERT for ADMIN users" ON packages_schema.package_table;
CREATE POLICY "Allow INSERT for ADMIN users" ON packages_schema.package_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = (SELECT auth.uid())
      AND amt.alliance_member_role = 'ADMIN'
  )
);

ALTER TABLE public.error_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for anon users" ON public.error_table;
CREATE POLICY "Allow READ for anon users" ON public.error_table
AS PERMISSIVE FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow Insert for anon users" ON public.error_table;
CREATE POLICY "Allow Insert for anon users" ON public.error_table
AS PERMISSIVE FOR INSERT
WITH CHECK (true);


ALTER TABLE merchant_schema.merchant_member_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for auth users" ON merchant_schema.merchant_member_table;
CREATE POLICY "Allow READ for auth users" ON merchant_schema.merchant_member_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow Insert for auth users" ON merchant_schema.merchant_member_table;
CREATE POLICY "Allow Insert for auth users" ON merchant_schema.merchant_member_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ;


DROP POLICY IF EXISTS "Allow UPDATE for ADMIN users" ON merchant_schema.merchant_member_table;
CREATE POLICY "Allow UPDATE for ADMIN users" ON merchant_schema.merchant_member_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = (SELECT auth.uid())
      AND amt.alliance_member_role IN ('ADMIN','MERCHANT')
  )
);



ALTER TABLE merchant_schema.merchant_member_table ENABLE ROW LEVEL SECURITY;

-- Allow READ for authenticated users with MERCHANT or ADMIN role
DROP POLICY IF EXISTS "Allow READ for MERCHANT and ADMIN users" ON merchant_schema.merchant_member_table;
CREATE POLICY "Allow READ for MERCHANT and ADMIN users" ON merchant_schema.merchant_member_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
          AND amt.alliance_member_role IN ('MERCHANT', 'ADMIN') -- Allow MERCHANT and ADMIN roles
    )
);


DROP POLICY IF EXISTS "Allow Insert for auth users" ON merchant_schema.merchant_member_table;
CREATE POLICY "Allow Insert for auth users" ON merchant_schema.merchant_member_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ( EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = (SELECT auth.uid())
     AND amt.alliance_member_role IN ('ADMIN','MERCHANT')
  ));

DROP POLICY IF EXISTS "Allow UPDATE for ADMIN users" ON merchant_schema.merchant_member_table;
CREATE POLICY "Allow UPDATE for ADMIN users" ON merchant_schema.merchant_member_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = (SELECT auth.uid())
      AND amt.alliance_member_role IN ('MERCHANT', 'ADMIN')
  )
);

ALTER TABLE alliance_schema.alliance_notification_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for MERCHANT and ADMIN users" ON alliance_schema.alliance_notification_table;
CREATE POLICY "Allow READ for MERCHANT and ADMIN users" ON alliance_schema.alliance_notification_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Allow Insert for MERCHANT and ADMIN users" ON alliance_schema.alliance_notification_table;
CREATE POLICY "Allow Insert for MERCHANT and ADMIN users" ON alliance_schema.alliance_notification_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
          AND amt.alliance_member_role IN ('MEMBER','MERCHANT','ACCOUNTING', 'ADMIN')
    )
);


ALTER TABLE alliance_schema.alliance_ranking_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for MERCHANT and ADMIN users" ON alliance_schema.alliance_ranking_table;
CREATE POLICY "Allow READ for MERCHANT and ADMIN users" ON alliance_schema.alliance_ranking_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
    )
);


DROP POLICY IF EXISTS "Allow Insert for MERCHANT and ADMIN users" ON alliance_schema.alliance_ranking_table;
CREATE POLICY "Allow Insert for MERCHANT and ADMIN users" ON alliance_schema.alliance_ranking_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Allow UPDATE for MERCHANT and ADMIN users" ON alliance_schema.alliance_ranking_table;
CREATE POLICY "Allow UPDATE for MERCHANT and ADMIN users" ON alliance_schema.alliance_ranking_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
  )
);

ALTER TABLE alliance_schema.alliance_transaction_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for MERCHANT and ADMIN users" ON alliance_schema.alliance_transaction_table;
CREATE POLICY "Allow READ for MERCHANT and ADMIN users" ON alliance_schema.alliance_transaction_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Allow Insert for MERCHANT and ADMIN users" ON alliance_schema.alliance_transaction_table;
CREATE POLICY "Allow Insert for MERCHANT and ADMIN users" ON alliance_schema.alliance_transaction_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
    )
);


ALTER TABLE alliance_schema.alliance_referral_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for MERCHANT and ADMIN users" ON alliance_schema.alliance_referral_table;
CREATE POLICY "Allow READ for MERCHANT and ADMIN users" ON alliance_schema.alliance_referral_table
AS PERMISSIVE FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Allow Insert for MERCHANT and ADMIN users" ON alliance_schema.alliance_referral_table;
CREATE POLICY "Allow Insert for MERCHANT and ADMIN users" ON alliance_schema.alliance_referral_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);


ALTER TABLE alliance_schema.alliance_preferred_withdrawal_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow READ for authenticated users" ON alliance_schema.alliance_preferred_withdrawal_table;
CREATE POLICY "Allow READ for authenticated users" ON alliance_schema.alliance_preferred_withdrawal_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
  )
);


DROP POLICY IF EXISTS "Allow Insert for Authenticated users" ON alliance_schema.alliance_preferred_withdrawal_table;
CREATE POLICY "Allow Insert for Authenticated users" ON alliance_schema.alliance_preferred_withdrawal_table
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
    )
);



  ALTER TABLE merchant_schema.merchant_table ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Allow READ for Authenticated users" ON merchant_schema.merchant_table;
  CREATE POLICY "Allow READ for Authenticated users" ON merchant_schema.merchant_table
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM alliance_schema.alliance_member_table amt
      WHERE amt.alliance_member_user_id = auth.uid()
    )
  );

  DROP POLICY IF EXISTS "Allow Insert for ADMIN users" ON merchant_schema.merchant_table;
  CREATE POLICY "Allow Insert for ADMIN users" ON merchant_schema.merchant_table
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (
      EXISTS (
          SELECT 1
          FROM alliance_schema.alliance_member_table amt
          WHERE amt.alliance_member_user_id = auth.uid()
          AND amt.alliance_member_role IN ('ADMIN','MERCHANT')
      )
  );



ALTER TABLE packages_schema.package_notification_logs ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Allow READ for ADMIN users" ON packages_schema.package_notification_logs;
CREATE POLICY "Allow READ for ADMIN users" ON packages_schema.package_notification_logs
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('ADMIN')
  )
);

DROP POLICY IF EXISTS "Allow Insert for ADMIN users" ON packages_schema.package_notification_logs;
CREATE POLICY "Allow Insert for ADMIN users" ON packages_schema.package_notification_logs
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
        AND amt.alliance_member_role IN ('ADMIN')
    )
);

ALTER TABLE chat_schema.chat_session_table ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Allow READ for ADMIN users" ON chat_schema.chat_session_table;
CREATE POLICY "Allow READ for ADMIN users" ON chat_schema.chat_session_table
AS PERMISSIVE FOR SELECT
TO authenticated

USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
    AND amt.alliance_member_role IN ('ADMIN')
  )
);

DROP POLICY IF EXISTS "Allow Insert for ADMIN users" ON chat_schema.chat_session_table;
CREATE POLICY "Allow Insert for ADMIN users" ON chat_schema.chat_session_table
AS PERMISSIVE FOR INSERT
TO authenticated

WITH CHECK (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
        AND amt.alliance_member_role IN ('ADMIN')
    )
);

DROP POLICY IF EXISTS "Allow update for ADMIN users" ON chat_schema.chat_session_table;
CREATE POLICY "Allow update for ADMIN users" ON chat_schema.chat_session_table
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM alliance_schema.alliance_member_table amt
        WHERE amt.alliance_member_user_id = auth.uid()
        AND amt.alliance_member_role IN ('ADMIN')
    )
);


DROP POLICY IF EXISTS "Allow READ for authenticated users" ON packages_schema.package_notification_table;
CREATE POLICY "Allow READ for authenticated users" ON packages_schema.package_notification_table
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM alliance_schema.alliance_member_table amt
    WHERE amt.alliance_member_user_id = auth.uid()
  )
);

GRANT ALL ON ALL TABLES IN SCHEMA user_schema TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA user_schema TO POSTGRES;
GRANT ALL ON SCHEMA user_schema TO postgres;
GRANT ALL ON SCHEMA user_schema TO public;

GRANT ALL ON ALL TABLES IN SCHEMA alliance_schema TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA alliance_schema TO POSTGRES;
GRANT ALL ON SCHEMA alliance_schema TO postgres;
GRANT ALL ON SCHEMA alliance_schema TO public;

GRANT ALL ON ALL TABLES IN SCHEMA packages_schema TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA packages_schema TO POSTGRES;
GRANT ALL ON SCHEMA packages_schema TO postgres;
GRANT ALL ON SCHEMA packages_schema TO public;

GRANT ALL ON ALL TABLES IN SCHEMA merchant_schema TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA merchant_schema TO POSTGRES;
GRANT ALL ON SCHEMA merchant_schema TO postgres;
GRANT ALL ON SCHEMA merchant_schema TO public;

GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO POSTGRES;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;