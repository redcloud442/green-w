DELETE FROM storage.buckets;

CREATE POLICY buckets_policy ON storage.buckets FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name) VALUES ('REQUEST_ATTACHMENTS', 'REQUEST_ATTACHMENTS');
INSERT INTO storage.buckets (id, name) VALUES ('USER_PROFILE', 'USER_PROFILE');
INSERT INTO storage.buckets (id, name) VALUES ('PACKAGE_IMAGES', 'PACKAGE_IMAGES');
UPDATE storage.buckets SET public = true;

CREATE EXTENSION IF NOT EXISTS plv8;




DROP view alliance_schema.dashboard_earnings_summary;
CREATE OR REPLACE VIEW alliance_schema.dashboard_earnings_summary AS
WITH 
    earnings AS (
        SELECT 
            package_member_member_id AS member_id,
            COALESCE(SUM(package_member_amount::DECIMAL), 0) AS total_amount,
            COALESCE(SUM(package_member_amount_earnings::DECIMAL), 0) AS total_earnings
        FROM packages_schema.package_earnings_log
        WHERE package_member_status = 'ENDED'
        GROUP BY package_member_member_id
    ),
    withdrawals AS (
        SELECT 
            alliance_withdrawal_request_member_id AS member_id,
            COALESCE(SUM(alliance_withdrawal_request_amount::DECIMAL), 0) AS total_withdrawals
        FROM alliance_schema.alliance_withdrawal_request_table
        WHERE alliance_withdrawal_request_status = 'APPROVED'
        GROUP BY alliance_withdrawal_request_member_id
    ),
    direct_referrals AS (
        SELECT 
            package_ally_bounty_member_id AS member_id,
            COUNT(DISTINCT(package_ally_bounty_from)) AS direct_referral_count,
            COALESCE(SUM(package_ally_bounty_earnings::DECIMAL), 0) AS direct_referral_amount
        FROM packages_schema.package_ally_bounty_log
        WHERE package_ally_bounty_type = 'DIRECT'
        GROUP BY package_ally_bounty_member_id
    ),
    indirect_referrals AS (
        SELECT 
            package_ally_bounty_member_id AS member_id,
            COALESCE(SUM(package_ally_bounty_earnings::DECIMAL), 0) AS indirect_referral_amount
        FROM packages_schema.package_ally_bounty_log
        WHERE package_ally_bounty_type = 'INDIRECT'
        GROUP BY package_ally_bounty_member_id
    )
SELECT 
    m.alliance_member_id AS member_id,
    COALESCE(e.total_earnings + d.direct_referral_amount + e.total_amount, 0) AS total_earnings,
    COALESCE(w.total_withdrawals, 0) AS total_withdrawals,
    COALESCE(d.direct_referral_amount, 0) AS direct_referral_amount,
    COALESCE(i.indirect_referral_amount, 0) AS indirect_referral_amount,
    COALESCE(e.total_amount + e.total_earnings, 0) AS package_income,
    COALESCE(d.direct_referral_count, 0) AS direct_referral_count
FROM alliance_schema.alliance_member_table m
LEFT JOIN earnings e ON m.alliance_member_id = e.member_id
LEFT JOIN withdrawals w ON m.alliance_member_id = w.member_id
LEFT JOIN direct_referrals d ON m.alliance_member_id = d.member_id
LEFT JOIN indirect_referrals i ON m.alliance_member_id = i.member_id


CREATE OR REPLACE FUNCTION get_current_date()
RETURNS TIMESTAMPTZ
SET search_path TO ''
AS $$
BEGIN
  return NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_merchant_option(
  input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = [];
plv8.subtransaction(function() {
    const {teamMemberId} = input_data;

    const member = plv8.execute(
    `
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
    `,
    [teamMemberId]
  );

  if (!member.length || !["MEMBER", "MERCHANT", "ACCOUNTING"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }


  const merchant = plv8.execute(
    `
    SELECT 
      merchant_id,
      merchant_account_name,
      merchant_account_number,
      merchant_account_type
    FROM merchant_schema.merchant_table
    `
  );

  returnData = merchant
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION create_user_trigger(
  input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData;
plv8.subtransaction(function() {
  const {
    userName,
    email,
    password,
    userId,
    referalLink,
    firstName,
    lastName,
    activeMobile,
    url
  } = input_data;



  if (referalLink) {

      if (!email || !password) {
    throw new Error('Both email and password are required to create a user.');
  }
  
  const DEFAULT_ALLIANCE_ID = '35f77cd9-636a-41fa-a346-9cb711e7a338';


  const insertUserQuery = `
    INSERT INTO user_schema.user_table (user_id, user_email, user_password, user_first_name, user_last_name, user_username, user_active_mobile)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING user_id, user_email
  `;
  const result = plv8.execute(insertUserQuery, [userId, email, password, firstName, lastName, userName, activeMobile]);

  if (!result || result.length === 0) {
    throw new Error('Failed to create user');
  }


  const allianceMemberId = plv8.execute(`
    INSERT INTO alliance_schema.alliance_member_table (alliance_member_role, alliance_member_alliance_id, alliance_member_user_id)
    VALUES ($1, $2, $3)
    RETURNING alliance_member_id
  `, ['MEMBER', DEFAULT_ALLIANCE_ID, userId])[0].alliance_member_id;

  const referralLinkURL = `${url}/${encodeURIComponent(userName)}`;
  plv8.execute(`
    INSERT INTO alliance_schema.alliance_referral_link_table (alliance_referral_link, alliance_referral_link_member_id)
    VALUES ($1, $2)
  `, [referralLinkURL, allianceMemberId]);

  plv8.execute(`
    INSERT INTO alliance_schema.alliance_notification_table (alliance_notification_user_id, alliance_notification_message)
    VALUES ($1, $2)
  `, [allianceMemberId, "Welcome to Elevate and Congratulations on your free account! Mag avail na ng Package para makapagsimula ka ng kumita!"]);


    handleReferral(referalLink, allianceMemberId);

     returnData = {
    success: true,
    user: result[0],
  };
  }
});
function handleReferral(referalLink, allianceMemberId) {
  
  const referrerData = plv8.execute(`
    SELECT 
      rl.alliance_referral_link_id,
      rt.alliance_referral_hierarchy,
      am.alliance_member_id
    FROM alliance_schema.alliance_referral_link_table rl
    LEFT JOIN alliance_schema.alliance_referral_table rt
      ON rl.alliance_referral_link_member_id = rt.alliance_referral_member_id
    LEFT JOIN alliance_schema.alliance_member_table am
      ON am.alliance_member_id = rl.alliance_referral_link_member_id
    LEFT JOIN user_schema.user_table ut
      ON ut.user_id = am.alliance_member_user_id
    WHERE ut.user_username = $1
  `, [referalLink]);

  if (referrerData.length === 0) {
    throw new Error('Invalid referral link');
  }

  const referrerLinkId = referrerData[0].alliance_referral_link_id;
  const parentHierarchy = referrerData[0].alliance_referral_hierarchy;
  const referrerMemberId = referrerData[0].alliance_member_id;

  const newReferral = plv8.execute(`
    INSERT INTO alliance_schema.alliance_referral_table (
      alliance_referral_member_id,
      alliance_referral_link_id,
      alliance_referral_hierarchy,
      alliance_referral_from_member_id
    ) VALUES ($1, $2, $3, $4)
    RETURNING alliance_referral_id
  `, [
    allianceMemberId,
    referrerLinkId,
    "",
    referrerMemberId
  ]);

  const newReferralId = newReferral[0].alliance_referral_id;
  
  const newHierarchy = parentHierarchy ? `${parentHierarchy}.${allianceMemberId}` : `${referrerMemberId}.${allianceMemberId}`;
  
  plv8.execute(`
    UPDATE alliance_schema.alliance_referral_table
    SET alliance_referral_hierarchy = $1
    WHERE alliance_referral_id = $2
  `, [newHierarchy, newReferralId]);
}
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_accountant_withdrawal_history(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  data: {
    APPROVED: { data: [], count: 0 },
    REJECTED: { data: [], count: 0 },
    PENDING: { data: [], count: 0 }
  },
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 13,
    search = '',
    teamMemberId,
    teamId,
    columnAccessor,
    isAscendingSort,
    userFilter,
    statusFilter,
    dateFilter
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || member[0].alliance_member_role !== 'ACCOUNTING') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const offset = (page - 1) * limit;

  const params = [teamId, limit, offset];
  const userCondition = userFilter ? `AND (u.user_username = '${userFilter}' OR u.user_id = '${userFilter}' OR u.user_first_name = '${userFilter}' OR u.user_last_name = '${userFilter}')` : "";
  const statusCondition = statusFilter ? `AND t.alliance_withdrawal_request_status = '${statusFilter}'` : "";
  const dateFilterCondition = dateFilter?.start && dateFilter?.end ? `AND t.alliance_withdrawal_request_date BETWEEN '${dateFilter.start}' AND '${dateFilter.end}'` : "";
  const searchCondition = search ? `AND u.user_username ILIKE '%${search}%'` : "";
  const sortBy = isAscendingSort ? "ASC" : "DESC";
  const sortCondition = columnAccessor
    ? `ORDER BY "${columnAccessor}" ${sortBy}`
    : "";

  const withdrawRequest = plv8.execute(`
    SELECT
      u.user_username,
      u.user_first_name,
      u.user_last_name,
      u.user_email,
      m.alliance_member_id,
      t.alliance_withdrawal_request_id,
      t.alliance_withdrawal_request_date,
      t.alliance_withdrawal_request_amount,
      t.alliance_withdrawal_request_status,
      t.alliance_withdrawal_request_reject_note,
      t.alliance_withdrawal_request_type,
      t.alliance_withdrawal_request_account
    FROM alliance_schema.alliance_withdrawal_request_table t
    JOIN alliance_schema.alliance_member_table m
      ON t.alliance_withdrawal_request_member_id = m.alliance_member_id
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    LEFT JOIN alliance_schema.alliance_member_table mt
      ON mt.alliance_member_id = t.alliance_withdrawal_request_approved_by
    LEFT JOIN user_schema.user_table approver
      ON approver.user_id = mt.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1
    ${searchCondition}
    ${userCondition}
    ${statusCondition}
    ${dateFilterCondition}
    ${sortCondition}
    LIMIT $2 OFFSET $3
  `, params);

  const statusCount = plv8.execute(`
    SELECT
      t.alliance_withdrawal_request_status AS status,
      COUNT(*) AS count
    FROM alliance_schema.alliance_withdrawal_request_table t
    JOIN alliance_schema.alliance_member_table m
      ON t.alliance_withdrawal_request_member_id = m.alliance_member_id
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1
    ${searchCondition}
    ${userCondition}
    ${dateFilterCondition}
    GROUP BY t.alliance_withdrawal_request_status
  `, [teamId]);

  ['APPROVED', 'REJECTED', 'PENDING'].forEach((status) => {
    const match = statusCount.find(item => item.status.trim().toUpperCase() === status);
    returnData.data[status].count = match ? BigInt(match.count) : BigInt(0);
  });


    withdrawRequest.forEach(request => {
      if (returnData.data[request.alliance_withdrawal_request_status]) {
        returnData.data[request.alliance_withdrawal_request_status].data.push(request);
      }
    });
  });
  const stringifyWithBigInt = (key, value) => {
    if (typeof value === "bigint") {
      return value.toString(); // Convert BigInt to string
    }
    return value;
  };

  // Return serialized result
  return JSON.parse(JSON.stringify(returnData, stringifyWithBigInt));
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_admin_dashboard_data_by_date(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  totalEarnings: 0,
  totalWithdraw: 0,
  directLoot: 0,
  indirectLoot: 0,
  chartData: []
};
plv8.subtransaction(function() {
  const { teamMemberId, dateFilter = {} } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: 'teamMemberId is required' };
    return;
  }

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || member[0].alliance_member_role !== 'ADMIN') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const currentDate = new Date(
    plv8.execute(`SELECT public.get_current_date()`)[0].get_current_date
  );

  const startDate = dateFilter.start || currentDate.toISOString().split('T')[0];
  const endDate = dateFilter.end || new Date(currentDate.setHours(23, 59, 59, 999)).toISOString();

  const packageEarnings = plv8.execute(`
    SELECT COALESCE(SUM(package_member_amount), 0) AS total_earnings
    FROM packages_schema.package_member_connection_table
    WHERE package_member_connection_created::Date BETWEEN $1 AND $2
  `, [startDate, endDate])[0];

  const totalEarnings = plv8.execute(`
    SELECT COALESCE(SUM(alliance_top_up_request_amount), 0) AS total_earnings
    FROM alliance_schema.alliance_top_up_request_table
    WHERE alliance_top_up_request_date::Date BETWEEN $1 AND $2
  `, [startDate, endDate])[0];

  const totalActivatedUserByDate = plv8.execute(`
    SELECT COUNT(*) AS activated_users
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_is_active = True AND alliance_member_date_updated::Date BETWEEN $1 AND $2
  `, [startDate, endDate])[0].activated_users;

  const totalApprovedWithdrawal = plv8.execute(`
    SELECT COUNT(*) AS total_approved_withdrawal
    FROM alliance_schema.alliance_withdrawal_request_table
    WHERE alliance_withdrawal_request_status = 'APPROVED' AND alliance_withdrawal_request_date::Date BETWEEN $1 AND $2
  `, [startDate, endDate])[0].total_approved_withdrawal;


  const totalWithdraw = plv8.execute(`
    SELECT COALESCE(SUM(alliance_withdrawal_request_amount - alliance_withdrawal_request_fee), 0) AS total_withdraw
    FROM alliance_schema.alliance_withdrawal_request_table
    WHERE alliance_withdrawal_request_status = 'APPROVED'
      AND alliance_withdrawal_request_date::Date BETWEEN $1 AND $2
  `, [startDate, endDate])[0];

  const directAndIndirectLoot = plv8.execute(`
    SELECT  
      COALESCE(SUM(CASE WHEN package_ally_bounty_type = 'DIRECT' THEN package_ally_bounty_earnings ELSE 0 END), 0) AS direct_loot,
      COALESCE(SUM(CASE WHEN package_ally_bounty_type = 'INDIRECT' THEN package_ally_bounty_earnings ELSE 0 END), 0) AS indirect_loot
    FROM packages_schema.package_ally_bounty_log
    WHERE package_ally_bounty_log_date_created::Date BETWEEN $1 AND $2
  `, [startDate, endDate])[0];

  const activePackageWithinTheDay = plv8.execute(`
    SELECT COUNT(*) AS active_packages
    FROM packages_schema.package_member_connection_table
    WHERE package_member_status = 'ACTIVE' AND package_member_connection_created::Date BETWEEN $1 AND $2
  `, [startDate, endDate])[0].active_packages;

  const chartData = plv8.execute(`
    WITH
      daily_earnings AS (
        SELECT
          DATE_TRUNC('day', alliance_top_up_request_date) AS date,
          SUM(alliance_top_up_request_amount) AS earnings
        FROM alliance_schema.alliance_top_up_request_table
        WHERE alliance_top_up_request_date::Date BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('day', alliance_top_up_request_date)
      ),
      daily_withdraw AS (
        SELECT
          DATE_TRUNC('day', alliance_withdrawal_request_date) AS date,
          SUM(alliance_withdrawal_request_amount - alliance_withdrawal_request_fee) AS withdraw
        FROM alliance_schema.alliance_withdrawal_request_table
        WHERE alliance_withdrawal_request_date::Date BETWEEN $1 AND $2
          AND alliance_withdrawal_request_status = 'APPROVED'
        GROUP BY DATE_TRUNC('day', alliance_withdrawal_request_date)
      ),
      combined AS (
        SELECT
          COALESCE(e.date, w.date) AS date,
          COALESCE(e.earnings, 0) AS earnings,
          COALESCE(w.withdraw, 0) AS withdraw
        FROM daily_earnings e
        FULL OUTER JOIN daily_withdraw w ON e.date = w.date
      )
    SELECT
      date::date,
      earnings,
      withdraw
    FROM combined
    ORDER BY date
  `, [startDate, endDate]);

  // Create a date range for chart data
  let dateRange = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dateRange.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  // Map chart data to the date range
  const chartDataMap = {};
  chartData.forEach(row => {
    chartDataMap[row.date.toISOString().split('T')[0]] = {
      earnings: row.earnings,
      withdraw: row.withdraw,
    };
  });

  returnData.chartData = dateRange.map(date => ({
    date,
    earnings: chartDataMap[date]?.earnings || 0,
    withdraw: chartDataMap[date]?.withdraw || 0,
  }));


  returnData.totalEarnings = totalEarnings.total_earnings;
  returnData.totalWithdraw = totalWithdraw.total_withdraw;
  returnData.directLoot = directAndIndirectLoot.direct_loot;
  returnData.indirectLoot = directAndIndirectLoot.indirect_loot;
  returnData.activePackageWithinTheDay = Number(activePackageWithinTheDay);
  returnData.totalApprovedWithdrawal = Number(totalApprovedWithdrawal);
  returnData.totalActivatedUserByDate = Number(totalActivatedUserByDate);
  returnData.packageEarnings = Number(packageEarnings.total_earnings);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_merchant_top_up_history(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  data: {
    APPROVED: { data: [], count: 0 },
    REJECTED: { data: [], count: 0 },
    PENDING: { data: [], count: 0 }
  },
  merchantBalance: 0
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 13,
    search = '',
    teamMemberId,
    teamId,
    isAscendingSort,
    columnAccessor,
    merchantFilter,
    userFilter,
    statusFilter = 'PENDING',
    dateFilter = null
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || member[0].alliance_member_role !== 'MERCHANT') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const offset = (page - 1) * limit;
  const sortBy = isAscendingSort ? "ASC" : "DESC";
  const sortCondition = columnAccessor
    ? `ORDER BY "${columnAccessor}" ${sortBy}`
    : "";
  const merchantCondition = merchantFilter ? `AND approver.user_id = '${merchantFilter}'` : "";
  const userCondition = userFilter ? `AND (u.user_username = '${userFilter}' OR u.user_id = '${userFilter}' OR u.user_first_name = '${userFilter}' OR u.user_last_name = '${userFilter}')` : "";
  const statusCondition = statusFilter ? `AND t.alliance_top_up_request_status = '${statusFilter}'` : "";
  const dateFilterCondition = dateFilter?.start && dateFilter?.end ? `AND t.alliance_top_up_request_date BETWEEN '${dateFilter.start}' AND '${dateFilter.end}'` : "";
  const searchCondition = search ? `AND u.user_username ILIKE '%${search}%'` : "";

  const params = [teamId, limit, offset];

  // Fetch top-up requests
  const topUpRequest = plv8.execute(`
    SELECT
      u.user_first_name,
      u.user_last_name,
      u.user_email,
      u.user_username,
      m.alliance_member_id,
      t.alliance_top_up_request_id,
      t.alliance_top_up_request_date,
      t.alliance_top_up_request_amount,
      t.alliance_top_up_request_status,
      t.alliance_top_up_request_attachment,
      t.alliance_top_up_request_type,
      t.alliance_top_up_request_name,
      t.alliance_top_up_request_account
    FROM alliance_schema.alliance_top_up_request_table t
    JOIN alliance_schema.alliance_member_table m
      ON t.alliance_top_up_request_member_id = m.alliance_member_id
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    LEFT JOIN alliance_schema.alliance_member_table mt
      ON mt.alliance_member_id = t.alliance_top_up_request_approved_by
    LEFT JOIN user_schema.user_table approver
      ON approver.user_id = mt.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1
    ${searchCondition}
    ${userCondition}
    ${statusCondition}
    ${dateFilterCondition}
    ${merchantCondition}
    ${sortCondition}
    LIMIT $2 OFFSET $3
  `, params);

  // Fetch status counts with dynamic sorting
  const statusCount = plv8.execute(`
    SELECT
      t.alliance_top_up_request_status AS status,
      COUNT(*) AS count
    FROM alliance_schema.alliance_top_up_request_table t
    JOIN alliance_schema.alliance_member_table m
      ON t.alliance_top_up_request_member_id = m.alliance_member_id
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    LEFT JOIN alliance_schema.alliance_member_table mt
      ON mt.alliance_member_id = t.alliance_top_up_request_approved_by
    LEFT JOIN user_schema.user_table approver
      ON approver.user_id = mt.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1
    ${searchCondition}
    ${userCondition}
    ${dateFilterCondition}
    ${merchantCondition}
    GROUP BY t.alliance_top_up_request_status
  `, [teamId]);

  // Fetch merchant balance
  const merchantBalance = plv8.execute(`
    SELECT merchant_member_balance
    FROM merchant_schema.merchant_member_table
    WHERE merchant_member_merchant_id = $1
  `, [teamMemberId])[0]?.merchant_member_balance || 0;

  ['APPROVED', 'REJECTED', 'PENDING'].forEach((status) => {
    const match = statusCount.find(item => item.status.trim().toUpperCase() === status);
    returnData.data[status].count = match ? BigInt(match.count) : BigInt(0);
  });

    topUpRequest.forEach(request => {
      if (returnData.data[request.alliance_top_up_request_status]) {
        returnData.data[request.alliance_top_up_request_status].data.push(request);
      }
    });

    returnData.merchantBalance = Number(merchantBalance);
  });
  const stringifyWithBigInt = (key, value) => {
    if (typeof value === "bigint") {
      return value.toString(); // Convert BigInt to string
    }
    return value;
  };

  // Return serialized result
  return JSON.parse(JSON.stringify(returnData, stringifyWithBigInt));
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_merchant_data(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  data: [],
  totalCount: 0,
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 10,
    teamMemberId
  } = input_data;

  const member = plv8.execute(
    `
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
    `,
    [teamMemberId]
  );

  if (!member.length || member[0].alliance_member_role !== 'MERCHANT') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  };

  const offset = (page - 1) * limit;

  const merchantData = plv8.execute(
    `
    SELECT 
      *
    FROM merchant_schema.merchant_table
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

    const merchantCount = plv8.execute(
    `
    SELECT COUNT(*)
    FROM merchant_schema.merchant_table
    `
  )[0].count;

  returnData.totalCount = Number(merchantCount);
  returnData.data = merchantData;
})
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_admin_dashboard_data(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  numberOfRegisteredUser: 0,
  totalActivatedPackage: 0,
  totalActivatedUser: 0,
  totalApprovedWithdrawal: 0,
};
plv8.subtransaction(function() {
  const { teamMemberId, dateFilter = {} } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: 'teamMemberId is required' };
    return;
  }

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || member[0].alliance_member_role !== 'ADMIN') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const totalActivatedPackage = plv8.execute(`
    SELECT COUNT(*) AS activated_packages
    FROM packages_schema.package_member_connection_table
    WHERE package_member_status = 'ACTIVE'
  `)[0].activated_packages;


  const numberOfRegisteredUser = plv8.execute(`
    SELECT COUNT(*) AS registered_users
    FROM alliance_schema.alliance_member_table
  `)[0].registered_users;

  const totalActivatedUser = plv8.execute(`
    SELECT COUNT(*) AS activated_users
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_is_active = True
  `)[0].activated_users;

  returnData.totalActivatedPackage = Number(totalActivatedPackage);
  returnData.numberOfRegisteredUser = Number(numberOfRegisteredUser);
  returnData.totalActivatedUser = Number(totalActivatedUser);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_admin_top_up_history(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  data: {
    APPROVED: { data: [], count: BigInt(0) },
    REJECTED: { data: [], count: BigInt(0) },
    PENDING: { data: [], count: BigInt(0) },
  },
  totalCount: BigInt(0),
};
plv8.subtransaction(function() {
    const {
        page = 1,
        limit = 13,
        search = '',
        teamMemberId,
        teamId,
        isAscendingSort,
        columnAccessor,
        merchantFilter,
        userFilter,
        statusFilter,
        dateFilter = null
      } = input_data;

    // Validate admin role
    const member = plv8.execute(`
      SELECT alliance_member_role
      FROM alliance_schema.alliance_member_table
      WHERE alliance_member_id = $1
    `, [teamMemberId]);

    if (!member.length || member[0].alliance_member_role !== 'ADMIN') {
      returnData = { success: false, message: 'Unauthorized access' };
      return;
    }

    // Query conditions
    const offset = (page - 1) * limit;
    const sortBy = isAscendingSort ? "ASC" : "DESC";
    const sortCondition = columnAccessor
      ? `ORDER BY "${columnAccessor}" ${sortBy}`
      : "";

    const merchantCondition = merchantFilter
      ? `AND approver.user_id = '${merchantFilter}'`
      : "";

    const userCondition = userFilter
      ? `AND (u.user_username ILIKE '%${search}%' 
            OR u.user_id::TEXT ILIKE '%${search}%' 
            OR u.user_first_name ILIKE '%${search}%' 
            OR u.user_last_name ILIKE '%${search}%')`
      : "";

    const statusCondition = statusFilter
      ? `AND t.alliance_top_up_request_status = '${statusFilter}'`
      : "";

    const dateFilterCondition = dateFilter?.start && dateFilter?.end
      ? `AND t.alliance_top_up_request_date BETWEEN '${dateFilter.start}' AND '${dateFilter.end}'`
      : "";

    const searchCondition = search
      ? `AND (u.user_username ILIKE '%${search}%' 
            OR u.user_id::TEXT ILIKE '%${search}%' 
            OR u.user_first_name ILIKE '%${search}%' 
            OR u.user_last_name ILIKE '%${search}%')`
      : "";

    const params = [teamId, limit, offset];

    // Fetch paginated top-up requests
    const topUpRequests = plv8.execute(`
      SELECT
        u.user_id,
        u.user_first_name,
        u.user_last_name,
        u.user_email,
        u.user_username,
        m.alliance_member_id,
        t.*,
        approver.user_username AS approver_username
      FROM alliance_schema.alliance_top_up_request_table t
      JOIN alliance_schema.alliance_member_table m
        ON t.alliance_top_up_request_member_id = m.alliance_member_id
      JOIN user_schema.user_table u
        ON u.user_id = m.alliance_member_user_id
      LEFT JOIN alliance_schema.alliance_member_table mt
        ON mt.alliance_member_id = t.alliance_top_up_request_approved_by
      LEFT JOIN user_schema.user_table approver
        ON approver.user_id = mt.alliance_member_user_id
      WHERE m.alliance_member_alliance_id = $1
      ${searchCondition}
      ${userCondition}
      ${statusCondition}
      ${dateFilterCondition}
      ${merchantCondition}
      ${sortCondition}
      LIMIT $2 OFFSET $3
    `, params);

    // Fetch status counts
    const statusCount = plv8.execute(`
      SELECT
        t.alliance_top_up_request_status AS status,
        COUNT(*) AS count
      FROM alliance_schema.alliance_top_up_request_table t
      JOIN alliance_schema.alliance_member_table m
        ON t.alliance_top_up_request_member_id = m.alliance_member_id
      JOIN user_schema.user_table u
        ON u.user_id = m.alliance_member_user_id
      LEFT JOIN alliance_schema.alliance_member_table mt
        ON mt.alliance_member_id = t.alliance_top_up_request_approved_by
      LEFT JOIN user_schema.user_table approver
        ON approver.user_id = mt.alliance_member_user_id
      WHERE m.alliance_member_alliance_id = $1
      ${dateFilterCondition}
      ${searchCondition}
      ${userCondition}
      ${merchantCondition}
      GROUP BY t.alliance_top_up_request_status
    `, [teamId]);

    // Initialize counts for all statuses
    ['APPROVED', 'REJECTED', 'PENDING'].forEach((status) => {
      const match = statusCount.find(item => item.status === status);
      returnData.data[status].count = match ? BigInt(match.count) : BigInt(0);
    });

    // Group requests by status
    topUpRequests.forEach(request => {
      if (returnData.data[request.alliance_top_up_request_status]) {
        returnData.data[request.alliance_top_up_request_status].data.push(request);
      }
    });

    // Calculate total count
      returnData.totalCount = statusCount.reduce(
        (sum, item) => sum + BigInt(item.count),
        BigInt(0)
      );
    });
    const stringifyWithBigInt = (key, value) => {
      if (typeof value === "bigint") {
        return value.toString(); // Convert BigInt to string
      }
      return value;
  };

  // Return serialized result
  return JSON.parse(JSON.stringify(returnData, stringifyWithBigInt));
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_admin_user_data(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
    data:[],
    totalCount:0
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 13,
    search = '',
    teamMemberId,
    teamId,
    columnAccessor,
    isAscendingSort,
    userRole,
    dateCreated,
    bannedUser
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || member[0].alliance_member_role !== 'ADMIN') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const offset = (page - 1) * limit;

  const params = [teamId, limit, offset];

  const searchCondition = search ? `AND u.user_username ILIKE '%${search}%' OR u.user_first_name ILIKE '%${search}%' OR u.user_last_name ILIKE '%${search}%'`: "";
  const roleCondition = userRole ? `AND m.alliance_member_role = '${userRole}'`: "";
  const dateCreatedCondition = dateCreated ? `AND u.user_date_created::Date = '${dateCreated}'`: "";
  const bannedUserCondition = bannedUser ? `AND m.alliance_member_restricted = True`: "";
  const sortBy = isAscendingSort ? "desc" : "asc";
  const sortCondition = columnAccessor
    ? `ORDER BY "${columnAccessor}" ${sortBy}`
    : "";

  const userRequest = plv8.execute(`
    SELECT
      u.*,
      m.*
    FROM alliance_schema.alliance_member_table m
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1
    ${searchCondition}
    ${roleCondition}
    ${dateCreatedCondition}
    ${bannedUserCondition}
    ${sortCondition}
    LIMIT $2 OFFSET $3
  `, params);

    const totalCount = plv8.execute(`
      SELECT
        COUNT(*)
     FROM alliance_schema.alliance_member_table m
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1
    ${searchCondition}
    ${roleCondition}
    ${dateCreatedCondition}
    ${bannedUserCondition}
  `,[teamId])[0].count;

  returnData.data = userRequest;
  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_admin_withdrawal_history(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  data: {
    APPROVED: { data: [], count: BigInt(0) }, // Initialize counts as BigInt
    REJECTED: { data: [], count: BigInt(0) },
    PENDING: { data: [], count: BigInt(0) },
  },
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 10,
    search = '',
    teamMemberId,
    teamId,
    columnAccessor,
    isAscendingSort,
    userFilter,
    statusFilter,
    dateFilter
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || member[0].alliance_member_role !== 'ADMIN') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const offset = (page - 1) * limit;

  const params = [teamId, limit, offset];
  const userCondition = userFilter ? `AND u.user_id = '${userFilter}'` : "";
  const statusCondition = statusFilter ? `AND t.alliance_withdrawal_request_status = '${statusFilter}'` : "";
  const dateFilterCondition = dateFilter?.start && dateFilter?.end
    ? `AND t.alliance_withdrawal_request_date BETWEEN '${dateFilter.start}' AND '${dateFilter.end}'`
    : "";
  const searchCondition = search
    ? `AND (
         t.alliance_withdrawal_request_id::TEXT ILIKE '%${search}%' OR
         u.user_id::TEXT ILIKE '%${search}%' OR
         u.user_username ILIKE '%${search}%' OR
         u.user_first_name ILIKE '%${search}%' OR
         u.user_last_name ILIKE '%${search}%'
       )`
    : "";
  const sortBy = isAscendingSort ? "desc" : "asc";
  const sortCondition = columnAccessor
    ? `ORDER BY "${columnAccessor}" ${sortBy}`
    : "";

  const withdrawRequest = plv8.execute(`
    SELECT
      u.user_id,
      u.user_username,
      u.user_first_name,
      u.user_last_name,
      u.user_email,
      m.alliance_member_id,
      t.*,
      approver.user_username AS approver_username
    FROM alliance_schema.alliance_withdrawal_request_table t
    JOIN alliance_schema.alliance_member_table m
      ON t.alliance_withdrawal_request_member_id = m.alliance_member_id
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    LEFT JOIN alliance_schema.alliance_member_table mt
      ON mt.alliance_member_id = t.alliance_withdrawal_request_approved_by
    LEFT JOIN user_schema.user_table approver
      ON approver.user_id = mt.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1
    ${searchCondition}
    ${userCondition}
    ${statusCondition}
    ${dateFilterCondition}
    ${sortCondition}
    LIMIT $2 OFFSET $3
  `, params);

  const statusCount = plv8.execute(`
    SELECT
      t.alliance_withdrawal_request_status AS status,
      COUNT(*) AS count
    FROM alliance_schema.alliance_withdrawal_request_table t
    JOIN alliance_schema.alliance_member_table m
      ON t.alliance_withdrawal_request_member_id = m.alliance_member_id
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    LEFT JOIN alliance_schema.alliance_member_table mt
      ON mt.alliance_member_id = t.alliance_withdrawal_request_approved_by
    LEFT JOIN user_schema.user_table approver
      ON approver.user_id = mt.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1
    ${searchCondition}
    ${userCondition}
    ${dateFilterCondition}
    GROUP BY t.alliance_withdrawal_request_status
  `, [teamId]);

  ['APPROVED', 'REJECTED', 'PENDING'].forEach((status) => {
    const match = statusCount.find(item => item.status.trim().toUpperCase() === status);
    returnData.data[status].count = match ? BigInt(match.count) : BigInt(0);
  });


    // Append withdrawal requests to the corresponding statuses
    withdrawRequest.forEach(request => {
      if (returnData.data[request.alliance_withdrawal_request_status]) {
        returnData.data[request.alliance_withdrawal_request_status].data.push(request);
      }
    });
  });

  // Custom JSON.stringify replacer to handle BigInt
  const stringifyWithBigInt = (key, value) => {
    if (typeof value === "bigint") {
      return value.toString(); // Convert BigInt to string
    }
    return value;
};
return JSON.parse(JSON.stringify(returnData, stringifyWithBigInt)); // Serialize with custom replacer
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_user_with_active_balance(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
    data: [],
    totalCount: 0,
    success: true,
    message: 'Data fetched successfully'
};
plv8.subtransaction(function() {

  const {
    teamMemberId,
    limit = 10,
    page = 1, 
    search,
    columnAccessor = 'ut.user_username', 
    sortBy = 'ASC'
  } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: 'teamMemberId is required' };
    return;
  }

    const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || member[0].alliance_member_role !== 'ADMIN') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const offset = (page - 1) * limit;

  const searchCondition = search
    ? `AND (ut.user_username ILIKE '%' ||'${search}' || '%' OR ut.user_id::TEXT ILIKE '%' ||'${search}' || '%')`
    : '';

  const userWithActiveBalance = plv8.execute(`
    SELECT 
      ut.user_id,
      ut.user_username,
      ut.user_first_name,
      ut.user_last_name,
      am.alliance_member_is_active
    FROM user_schema.user_table ut
    JOIN alliance_schema.alliance_member_table am
      ON ut.user_id = am.alliance_member_user_id
    LEFT JOIN alliance_schema.alliance_earnings_table ae
      ON ae.alliance_earnings_member_id = am.alliance_member_id
    WHERE 
      ae.alliance_olympus_wallet > 0
      ${searchCondition}
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  returnData.data = userWithActiveBalance;

  // Execute the total count query
  const totalCount = plv8.execute(`
    SELECT COUNT(*)
    FROM user_schema.user_table ut
    JOIN alliance_schema.alliance_member_table am
      ON ut.user_id = am.alliance_member_user_id
    LEFT JOIN alliance_schema.alliance_earnings_table ae
      ON ae.alliance_earnings_member_id = am.alliance_member_id
    WHERE 
      ae.alliance_olympus_wallet > 0
      ${searchCondition}
  `)[0].count;

  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_user_sponsor(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
    data: {
      user_username: ''
    },
    success: true,
    message: 'Data fetched successfully'
};
plv8.subtransaction(function() {  
  const {
   userId
  } = input_data;

  const userSponsor = plv8.execute(`
   SELECT 
        ut2.user_username
      FROM user_schema.user_table ut
      JOIN alliance_schema.alliance_member_table am
        ON am.alliance_member_user_id = ut.user_id
      JOIN alliance_schema.alliance_referral_table art
        ON art.alliance_referral_member_id = am.alliance_member_id
      JOIN alliance_schema.alliance_member_table am2
        ON am2.alliance_member_id = art.alliance_referral_from_member_id
      JOIN user_schema.user_table ut2
        ON ut2.user_id = am2.alliance_member_user_id
      WHERE ut.user_id = $1
  `, [userId]);

  returnData.data.user_username = userSponsor[0].user_username;
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_ally_bounty(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
    data: [],
    totalCount: 0,
    success: true,
    message: 'Data fetched successfully'
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 10,
    search = '',
    teamMemberId,
    columnAccessor = 'user_first_name',
    isAscendingSort = true
  } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: 'teamMemberId is required' };
    return;
  }

  const member = plv8.execute(
    `SELECT alliance_member_role
     FROM alliance_schema.alliance_member_table
     WHERE alliance_member_id = $1`,
    [teamMemberId]
  );

  if (!member.length || !["ADMIN", "ACCOUNTING", "MERCHANT", "MEMBER"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const offset = (page - 1) * limit;

  const directReferrals = plv8.execute(
    `SELECT alliance_referral_member_id
     FROM alliance_schema.alliance_referral_table
     WHERE alliance_referral_from_member_id = $1`,
    [teamMemberId]
  ).map((ref) => ref.alliance_referral_member_id);

  if (!directReferrals.length) {
    returnData = { success: true, data: [], totalCount: 0 };
    return;
  }

  const params = [directReferrals, teamMemberId, limit, offset];
  const searchCondition = search
    ? `AND (u.user_first_name ILIKE '%${search}%' OR u.user_last_name ILIKE '%${search}%' OR u.user_username ILIKE '%${search}%')`
    : '';

  const sortBy = isAscendingSort ? "ASC" : "DESC";
  const sortCondition = columnAccessor
    ? `ORDER BY "${columnAccessor}" ${sortBy}`
    : '';

  // Fetch user request data
  const userRequest = plv8.execute(
    `SELECT
       u.user_first_name,
       u.user_last_name,
       u.user_username,
       m.alliance_member_id,
       u.user_date_created,
       pa.package_ally_bounty_log_date_created,
       COALESCE(SUM(pa.package_ally_bounty_earnings)::TEXT, '0') AS total_bounty_earnings
     FROM alliance_schema.alliance_member_table m
     JOIN user_schema.user_table u
       ON u.user_id = m.alliance_member_user_id
     JOIN packages_schema.package_ally_bounty_log pa
       ON pa.package_ally_bounty_from = m.alliance_member_id
     WHERE pa.package_ally_bounty_from = ANY($1) AND pa.package_ally_bounty_member_id = $2
     ${searchCondition}
     GROUP BY u.user_first_name, u.user_last_name, u.user_username, m.alliance_member_id, u.user_date_created,pa.package_ally_bounty_log_date_created
     ORDER BY pa.package_ally_bounty_log_date_created DESC
     LIMIT $3 OFFSET $4`,
    params
  );

  // Convert total_bounty_earnings to number for each record
  userRequest.forEach(row => {
    row.total_bounty_earnings = Number(row.total_bounty_earnings);
  });

  // Fetch total count
  const totalCountResult = plv8.execute(
    `SELECT COUNT(*)
     FROM alliance_schema.alliance_member_table m
     JOIN user_schema.user_table u
       ON u.user_id = m.alliance_member_user_id
     JOIN packages_schema.package_ally_bounty_log pa
       ON pa.package_ally_bounty_member_id = m.alliance_member_id
     WHERE pa.package_ally_bounty_from = ANY($1) AND pa.package_ally_bounty_member_id = $2
     ${searchCondition}`,
    [directReferrals, teamMemberId]
  );

  returnData.data = userRequest;
  returnData.totalCount = Number(totalCountResult[0].count);
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_dashboard_earnings(
    input_data JSON
)
RETURNS JSON
AS $$
let returnData = {};
plv8.subtransaction(function() {
  const { teamMemberId } = input_data;

  // Validate role
  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || !["MEMBER", "MERCHANT", "ACCOUNTING"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  // Fetch earnings data
  const earningsData = plv8.execute(`
    SELECT 
        total_earnings,
        total_withdrawals,
        direct_referral_amount,
        indirect_referral_amount,
        package_income,
        direct_referral_count
    FROM alliance_schema.dashboard_earnings_summary
    WHERE member_id = $1
  `, [teamMemberId]);

  if (!earningsData.length) {
    returnData = {
      success: true,
      totalEarnings: 0,
      withdrawalAmount: 0,
      directReferralAmount: 0,
      indirectReferralAmount: 0,
      package_income: 0,
      rank: null,
      tags: [],
    };
    return;
  }


  const data = earningsData[0];
  const totalEarnings = Number(data.total_earnings) || 0;
  const referralCount = Number(data.direct_referral_count) || 0;

  // Rank and income tag mapping
  const rankMapping = [
    { threshold: 500, rank: "diamond" },
    { threshold: 200, rank: "sapphire" },
    { threshold: 150, rank: "ruby" },
    { threshold: 100, rank: "emerald" },
    { threshold: 50, rank: "platinum" },
    { threshold: 20, rank: "gold" },
    { threshold: 10, rank: "silver" },
    { threshold: 6, rank: "bronze" },
    { threshold: 3, rank: "iron" },
  ];

  const incomeTags = [
    {threshold:2000000, tag:"Multi Millionaire"},
    { threshold: 1000000, tag: "Millionaire" },
    { threshold: 500000, tag: "500k earner" },
    { threshold: 100000, tag: "100k earner" },
    { threshold: 50000, tag: "50k earner" },
  ];

  const applicableRank = rankMapping.find(rank => referralCount >= rank.threshold)?.rank || null;
  const applicableIncomeTag = incomeTags.find(tag => totalEarnings >= tag.threshold)?.tag || null;

  // Fetch current rank and tag
  const currentData = plv8.execute(`
    SELECT alliance_rank, alliance_total_income_tag
    FROM alliance_schema.alliance_ranking_table
    WHERE alliance_ranking_member_id = $1
  `, [teamMemberId]);

  const currentRank = currentData.length ? currentData[0].alliance_rank : null;
  const currentIncomeTag = currentData.length ? currentData[0].alliance_total_income_tag : null;

  // Update rank and tag if changes are detected
  if (currentRank !== applicableRank || currentIncomeTag !== applicableIncomeTag) {
    if (currentRank !== applicableRank) {
      plv8.execute(`
        INSERT INTO alliance_schema.alliance_notification_table (alliance_notification_user_id, alliance_notification_message)
        VALUES ($1, $2)
      `, [teamMemberId, `You have been promoted to ${applicableRank}!`]);
    }

    if (currentIncomeTag !== applicableIncomeTag && applicableIncomeTag) {
      plv8.execute(`
        INSERT INTO alliance_schema.alliance_notification_table (alliance_notification_user_id, alliance_notification_message)
        VALUES ($1, $2)
      `, [teamMemberId, `Congratulations! You have achieved the ${applicableIncomeTag} milestone!`]);
    }

    plv8.execute(`
      INSERT INTO alliance_schema.alliance_ranking_table (alliance_ranking_member_id, alliance_rank, alliance_total_income_tag)
      VALUES ($1, $2, $3)
      ON CONFLICT (alliance_ranking_member_id)
      DO UPDATE SET alliance_rank = $2, alliance_total_income_tag = $3;
    `, [teamMemberId, applicableRank, applicableIncomeTag]);
  }


  const tags = [];
  if (applicableIncomeTag) tags.push(applicableIncomeTag);


  returnData = {
    success: true,
    totalEarnings,
    withdrawalAmount: data.total_withdrawals || 0,
    directReferralAmount: data.direct_referral_amount || 0,
    indirectReferralAmount: data.indirect_referral_amount || 0,
    package_income: data.package_income || 0,
    rank: applicableRank,
    tags,
  };
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_dashboard_data(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = [];
let totalCompletedAmount = 0;
plv8.subtransaction(function() {
  const { teamMemberId } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: 'teamMemberId is required' };
    return;
  }

  const currentTimestamp = new Date(
    plv8.execute(`SELECT public.get_current_date()`)[0].get_current_date
  );

  const member = plv8.execute(
    `SELECT alliance_member_role 
     FROM alliance_schema.alliance_member_table 
     WHERE alliance_member_id = $1`,
    [teamMemberId]
  );

  if (!member.length || (!["MEMBER", "MERCHANT", "ACCOUNTING"].includes(member[0].alliance_member_role))) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }
  
  const chartData = plv8.execute(
    `SELECT
      p.package_name AS package,
      p.package_color,
      p.packages_days::INTEGER AS packages_days,
      pmc.package_member_status,
      pmc.package_member_connection_created,
      (pmc.package_member_amount) AS amount,
      pmc.package_member_connection_id,
      pmc.package_member_package_id,
      pmc.package_member_member_id,
      pmc.package_member_amount,
      pmc.package_member_is_notified,
      pmc.package_amount_earnings,
      pmc.package_member_completion_date
    FROM packages_schema.package_member_connection_table pmc
    JOIN packages_schema.package_table p
      ON pmc.package_member_package_id = p.package_id
    WHERE pmc.package_member_status = $1 AND pmc.package_member_member_id = $2
    ORDER BY pmc.package_member_connection_created DESC`,
    ['ACTIVE', teamMemberId]
  );
  
  returnData = chartData.reduce((acc, row) => {
    const startDate = new Date(row.package_member_connection_created);
    const completionDate = new Date(row.package_member_completion_date);

    const elapsedTimeMs = Math.max(currentTimestamp - startDate, 0);
    const totalTimeMs = Math.max(completionDate - startDate, 0);

    let percentage = totalTimeMs > 0
      ? parseFloat(((elapsedTimeMs / totalTimeMs) * 100).toFixed(2))
      : 100.0;

    percentage = Math.min(percentage, 100);

    const isReadyToClaim = percentage === 100;

    if (isReadyToClaim) {
      const earnings = row.amount;
      totalCompletedAmount += earnings; 

      plv8.execute(
        `UPDATE packages_schema.package_member_connection_table
         SET package_member_status = 'ENDED', 
         package_member_is_ready_to_claim = true
         WHERE package_member_connection_id = $1`,
        [row.package_member_connection_id]
      );
    }

    acc.push({
      package: row.package,
      package_days: row.packages_days,
      package_color:row.package_color,
      package_connection_id:row.package_member_connection_id,
      package_date_created:row.package_member_connection_created,
      completion_date: completionDate.toISOString(),
      completion: percentage,
      amount: parseFloat(row.amount),
      profit_amount: parseFloat(row.package_amount_earnings),
      is_ready_to_claim: isReadyToClaim,
      is_notified: row.package_member_is_notified,
    });

    return acc;
  }, []);

  returnData = {
    success: true,
    data: returnData,
    totalCompletedAmount: totalCompletedAmount,
  };
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_direct_sponsor(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = ""
plv8.subtransaction(function() {
  const { teamMemberId } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: "teamMemberId is required" };
    return;
  }

  const member = plv8.execute(
    `SELECT alliance_member_role
     FROM alliance_schema.alliance_member_table
     WHERE alliance_member_id = $1`,
    [teamMemberId]
  );

  if (!member.length || !["ADMIN", "ACCOUNTING", "MERCHANT", "MEMBER"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: "Unauthorized access" };
    return;
  }


  const result = plv8.execute(
    `SELECT u.user_username
     FROM alliance_schema.alliance_referral_table ar
     JOIN alliance_schema.alliance_member_table am
       ON am.alliance_member_id = ar.alliance_referral_from_member_id
     JOIN user_schema.user_table u
       ON u.user_id = am.alliance_member_user_id
     WHERE ar.alliance_referral_member_id = $1`,
    [teamMemberId]
  );

  if (result.length > 0) {
    returnData =  result[0].user_username ;
  } else {
    returnData = null;
  }
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_earnings_modal_data(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = []
plv8.subtransaction(function() {
  const {
    teamMemberId
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length ||!["MEMBER", "MERCHANT", "ACCOUNTING"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const earningsData = plv8.execute(`
    SELECT 
    alliance_olympus_earnings,
    alliance_olympus_wallet,
    alliance_referral_bounty,
    alliance_combined_earnings
    FROM alliance_schema.alliance_earnings_table
    WHERE alliance_earnings_member_id = $1
  `, [teamMemberId])[0];

  returnData = earningsData
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_error_post(
    input_data JSON
)
RETURNS VOID
SET search_path TO ''
AS $$
  const { error_message, function_name, stack_trace, stack_path } = input_data;
  plv8.execute(
    `
    INSERT INTO public.error_table (
      error_message,
      error_function_name,
      error_stack_trace,
      error_stack_path
    ) VALUES ($1, $2, $3, $4)
    `,
    [error_message, function_name, stack_trace, stack_path]
  );
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_history_log(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
    data: [],
    totalCount: 0,
    success: true,
    message: "Data fetched successfully",
};
plv8.subtransaction(function () {
  const {
    page = 1,
    limit = 13,
    teamMemberId,
    columnAccessor = "u.user_first_name",
    isAscendingSort = true,
  } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: "teamMemberId is required" };
    return;
  }

  const member = plv8.execute(
    `
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `,
    [teamMemberId]
  );

  if (!member.length || member[0].alliance_member_role !== "ADMIN") {
    returnData = { success: false, message: "Unauthorized access" };
    return;
  }

  const offset = (page - 1) * limit;
  const sortBy = isAscendingSort ? "DESC" : "ASC";

  const historyLog = plv8.execute(
    `
    SELECT
      h.*,
      u.user_first_name,
      u.user_last_name,
      u.user_email
    FROM user_schema.user_table u
    JOIN user_schema.user_history_log h
    ON u.user_id = h.user_history_user_id
    ORDER BY
      ${columnAccessor} ${sortBy}
    LIMIT $1 OFFSET $2
  `,
    [limit, offset]
  );

  const historyLogCount = plv8.execute(
    `
    SELECT COUNT(*)
    FROM user_schema.user_table u
    JOIN user_schema.user_history_log h
    ON u.user_id = h.user_history_user_id
  `
  )[0].count;

  returnData.data = historyLog;
  returnData.totalCount = Number(historyLogCount);
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_leaderboard_data(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {};
plv8.subtransaction(() => {
  const { leaderBoardType, teamMemberId, limit = 10, page = 0 } = input_data;
  const offset = (page - 1) * limit;

  const member = plv8.execute(
    `
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
    `,
    [teamMemberId]
  );

  if (!member.length || member[0].alliance_member_role !== 'ADMIN') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  if (!['DIRECT', 'INDIRECT'].includes(leaderBoardType)) {
    returnData = { success: false, message: 'Invalid leaderboard type' };
    return;
  }

  const totalCountQuery = `
    SELECT COUNT(DISTINCT package_ally_bounty_member_id) AS totalCount
    FROM packages_schema.package_ally_bounty_log
    WHERE package_ally_bounty_type = $1
  `;

  const totalCountResult = plv8.execute(totalCountQuery, [leaderBoardType]);
  let totalCount = parseInt(totalCountResult[0].totalcount);

  // Stop processing if totalCount is 50 or more
  if (totalCount >= 50) {
    returnData = {
      totalCount: 50, // Ensure the returned totalCount is capped at 50
      data: [] // Optionally, provide empty or partial data if needed
    };
    return;
  }

  const query = `
    SELECT 
      alliance_member_id,
      user_username,
      SUM(package_ally_bounty_earnings) AS totalAmount,
      COUNT(DISTINCT package_ally_bounty_from) AS totalReferral
    FROM packages_schema.package_ally_bounty_log
    JOIN alliance_schema.alliance_member_table
      ON package_ally_bounty_member_id = alliance_member_id
    JOIN user_schema.user_table
      ON alliance_member_user_id = user_id
    WHERE package_ally_bounty_type = $1
    GROUP BY alliance_member_id, user_username
    ORDER BY totalAmount DESC
    LIMIT $2 OFFSET $3
  `;

  const leaderBoardData = plv8.execute(query, [leaderBoardType, limit, offset]);

  returnData = {
    totalCount,
    data: leaderBoardData.map(row => ({
      teamMemberId: row.alliance_member_id,
      username: row.user_username,
      totalAmount: parseFloat(row.totalamount),
      totalReferral: parseInt(row.totalreferral)
    }))
  };
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_legion_bounty(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  data: [],
  totalCount: 0,
  success: true,
  message: 'Data fetched successfully',
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 13,
    search = '',
    teamMemberId,
    userId,
    columnAccessor = 'pa.package_ally_bounty_log_date_created',
    isAscendingSort = false,
  } = input_data;

  if (!userId) {
    returnData = { success: false, message: 'teamMemberId is required' };
    return;
  }

  // Check if the team member has the correct role
  const member = plv8.execute(
    `
    SELECT alliance_member_role, alliance_member_id
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_user_id = $1
    `,
    [userId]
  );

  if (!member.length || !["ADMIN", "ACCOUNTING", "MERCHANT", "MEMBER"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const directReferrals = plv8.execute(
    `
    SELECT alliance_referral_member_id
    FROM alliance_schema.alliance_referral_table
    WHERE alliance_referral_from_member_id = $1
    `,
    [member[0].alliance_member_id]
  ).map((ref) => ref.alliance_referral_member_id);

  let indirectReferrals = new Set();
  let currentLevelReferrals = [member[0].alliance_member_id];
  let currentLevel = 0;
  const maxLevel = 10;

  while (currentLevel < maxLevel && currentLevelReferrals.length > 0) {
    const referrerData = plv8.execute(
      `
      SELECT ar.alliance_referral_hierarchy
      FROM alliance_schema.alliance_referral_table ar
      JOIN alliance_schema.alliance_referral_link_table al
        ON al.alliance_referral_link_id = ar.alliance_referral_link_id
      WHERE al.alliance_referral_link_member_id = ANY($1)
      `,
      [currentLevelReferrals]
    );

    let nextLevelReferrals = [];

    referrerData.forEach((ref) => {
      const hierarchyArray = ref.alliance_referral_hierarchy.split('.').slice(1);

      hierarchyArray.forEach((id) => {
        if (!indirectReferrals.has(id) && id !== member[0].alliance_member_id) {
          indirectReferrals.add(id);
          nextLevelReferrals.push(id);
        }
      });
    });

    currentLevelReferrals = nextLevelReferrals;
    currentLevel++;
  }

  indirectReferrals = Array.from(indirectReferrals).filter(
    (id) => !directReferrals.includes(id)
  );

  if (!indirectReferrals.length) {
    returnData = { success: false, message: 'No referral data found' };
    return;
  }

  const offset = Math.max((page - 1) * limit, 0);
  let params = [indirectReferrals, member[0].alliance_member_id, limit, offset];
  let searchCondition = '';

  if (search) {
    searchCondition = `AND (ut.user_first_name ILIKE '%${search}%' OR ut.user_last_name ILIKE '%${search}%' OR ut.user_username ILIKE '%${search}%')`;
  }

  const indirectReferralDetails = plv8.execute(
    `
    SELECT 
      ut.user_first_name, 
      ut.user_last_name, 
      ut.user_username, 
      ut.user_date_created,
      am.alliance_member_id,
      pa.package_ally_bounty_log_date_created,
      COALESCE(SUM(pa.package_ally_bounty_earnings), 0) AS total_bounty_earnings
    FROM alliance_schema.alliance_member_table am
    JOIN user_schema.user_table ut
      ON ut.user_id = am.alliance_member_user_id
    JOIN packages_schema.package_ally_bounty_log pa
      ON am.alliance_member_id = pa.package_ally_bounty_from
    WHERE pa.package_ally_bounty_from = ANY($1)
      AND pa.package_ally_bounty_member_id = $2
      ${searchCondition}
    GROUP BY 
      ut.user_first_name, 
      ut.user_last_name, 
      ut.user_username, 
      ut.user_date_created,
      am.alliance_member_id,
      pa.package_ally_bounty_log_date_created
    ORDER BY  pa.package_ally_bounty_log_date_created DESC
    LIMIT $3 OFFSET $4
    `,
    params
  );
  const totalCountResult = plv8.execute(
    `
    SELECT 
      COUNT(*) AS count
    FROM (
      SELECT 
        pa.package_ally_bounty_from
      FROM alliance_schema.alliance_member_table am
      JOIN user_schema.user_table ut
        ON ut.user_id = am.alliance_member_user_id
      JOIN packages_schema.package_ally_bounty_log pa
        ON am.alliance_member_id = pa.package_ally_bounty_from
      WHERE pa.package_ally_bounty_from = ANY($1)
        AND pa.package_ally_bounty_member_id = $2
        ${searchCondition}
      GROUP BY 
        pa.package_ally_bounty_from,
        ut.user_first_name,
        ut.user_last_name,
        ut.user_username,
        ut.user_date_created,
        am.alliance_member_id,
        pa.package_ally_bounty_log_date_created
    ) AS subquery
    `,
    [indirectReferrals, member[0].alliance_member_id]
  );


  returnData.data = indirectReferralDetails;
  returnData.totalCount = Number(totalCountResult[0].count);
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_member_withdrawal_history(
  input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
    data:[],
    totalCount:0
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 13,
    search = '',
    teamMemberId,
    teamId,
    columnAccessor,
    isAscendingSort,
    userId
  } = input_data;


  const member = plv8.execute(`
    SELECT alliance_member_role, alliance_member_id
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_user_id = $1
  `, [userId])[0];

  const offset = (page - 1) * limit;

  const params = [teamId,member.alliance_member_id, limit, offset];

  const searchCondition = search
  ? `AND t.alliance_withdrawal_request_id::TEXT ILIKE '%${search}%'`
  : "";
  const sortBy = isAscendingSort ? "desc" : "asc";
  const sortCondition = columnAccessor 
    ? `ORDER BY "${columnAccessor}" ${sortBy}` 
    : "";

  const topUpRequest = plv8.execute(`
    SELECT
      u.user_first_name,
      u.user_last_name,
      u.user_email,
      m.alliance_member_id,
      t.*
    FROM alliance_schema.alliance_withdrawal_request_table t
    JOIN alliance_schema.alliance_member_table m
      ON t.alliance_withdrawal_request_member_id = m.alliance_member_id
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1 AND
    t.alliance_withdrawal_request_member_id = $2
    ${searchCondition}
    ${sortCondition}
    LIMIT $3 OFFSET $4
  `, params);

    const totalCount = plv8.execute(`
        SELECT
            COUNT(*)
        FROM alliance_schema.alliance_withdrawal_request_table t
        JOIN alliance_schema.alliance_member_table m
        ON t.alliance_withdrawal_request_member_id = m.alliance_member_id
        JOIN user_schema.user_table u
        ON u.user_id = m.alliance_member_user_id
        WHERE m.alliance_member_alliance_id = $1 AND
        t.alliance_withdrawal_request_member_id = $2
        ${searchCondition}
  `,[teamId,teamMemberId])[0].count;

  returnData.data = topUpRequest;
  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_member_package_history(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  data: [],
  totalCount: 0,
  success: true,
  message: "Data fetched successfully",
};
plv8.subtransaction(function() {
  const { teamMemberId, search, sortBy, columnAccessor, page, limit } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: 'teamMemberId is required' };
    return;
  }

  const offset = (page - 1) * limit;

  const member = plv8.execute(
    `SELECT alliance_member_role FROM alliance_schema.alliance_member_table WHERE alliance_member_id = $1`,
    [teamMemberId]
  );

  if (!member.length || !["MEMBER", "MERCHANT", "ACCOUNTING"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const searchCondition = search ? `AND p.package_name ILIKE '%${search}%'` : '';
  const sortByCondition = sortBy === 'DESC' ? 'DESC' : 'ASC';
  const orderByCondition = columnAccessor ? `ORDER BY ${columnAccessor} ${sortByCondition}` : '';

  const packageHistory = plv8.execute(
    `SELECT 
     pmc.package_member_connection_id,
     p.package_name, 
     pmc.package_member_connection_created,
     pmc.package_member_amount_earnings, 
     pmc.package_member_status
    FROM packages_schema.package_earnings_log pmc
    JOIN packages_schema.package_table p
      ON pmc.package_member_package_id = p.package_id
    WHERE pmc.package_member_member_id = $1
    ${searchCondition}
    ${orderByCondition}
    LIMIT $2 OFFSET $3`,
    [teamMemberId, limit, offset]
  );

  const totalCount = plv8.execute(
    `SELECT COUNT(*)
     FROM packages_schema.package_earnings_log pmc
     JOIN packages_schema.package_table p
       ON pmc.package_member_package_id = p.package_id
     WHERE pmc.package_member_member_id = $1
     ${searchCondition}`,
    [teamMemberId]
  )[0].count;

  returnData.data = packageHistory;
  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_member_top_up_history(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
    data:[],
    totalCount:0
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 13,
    search = '',
    teamMemberId,
    teamId,
    columnAccessor,
    isAscendingSort,
    userId
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role, alliance_member_id
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_user_id = $1
  `, [userId]);


  const offset = (page - 1) * limit;

  const params = [teamId,member[0].alliance_member_id, limit, offset];

  const searchCondition = search ? `AND t.alliance_top_up_request_id::TEXT ILIKE '%${search}%'`: "";
  const sortBy = isAscendingSort ? "desc" : "asc";
  const sortCondition = columnAccessor 
    ? `ORDER BY "${columnAccessor}" ${sortBy}` 
    : "";

  const topUpRequest = plv8.execute(`
    SELECT
      u.user_first_name,
      u.user_last_name,
      u.user_email,
      m.alliance_member_id,
      t.*
    FROM alliance_schema.alliance_top_up_request_table t
    JOIN alliance_schema.alliance_member_table m
      ON t.alliance_top_up_request_member_id = m.alliance_member_id
    JOIN user_schema.user_table u
      ON u.user_id = m.alliance_member_user_id
    WHERE m.alliance_member_alliance_id = $1 AND
    t.alliance_top_up_request_member_id = $2
    ${searchCondition}
    ${sortCondition}
    LIMIT $3 OFFSET $4
  `, params);

    const totalCount = plv8.execute(`
        SELECT
            COUNT(*)
        FROM alliance_schema.alliance_top_up_request_table t
        JOIN alliance_schema.alliance_member_table m
        ON t.alliance_top_up_request_member_id = m.alliance_member_id
        JOIN user_schema.user_table u
        ON u.user_id = m.alliance_member_user_id
        WHERE m.alliance_member_alliance_id = $1 AND
        t.alliance_top_up_request_member_id = $2
        ${searchCondition}
  `,[teamId,member[0].alliance_member_id])[0].count;

  returnData.data = topUpRequest;
  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_package_modal_data(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = []
plv8.subtransaction(function() {
  const {
    teamMemberId
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || !["MEMBER", "MERCHANT", "ACCOUNTING"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const packageData = plv8.execute(`
    SELECT *
    FROM packages_schema.package_table
  `);

  returnData = packageData
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_package_modal_data(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = []
plv8.subtransaction(function() {
  const {
    teamMemberId
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || !["MEMBER", "MERCHANT", "ACCOUNTING"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const packageData = plv8.execute(`
    SELECT *
    FROM packages_schema.package_table
  `);

  returnData = packageData
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_packages_admin(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = [];
plv8.subtransaction(function() {
  const {
    teamMemberId,
  } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: 'teamMemberId is required' };
    return;
  }

  const member = plv8.execute(
    `
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `,
    [teamMemberId]
  );
  if (!member.length || member[0].alliance_member_role !== 'ADMIN') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const packagesData = plv8.execute(`
     SELECT * FROM packages_schema.package_table
  `);

  returnData = packagesData;
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_total_earnings(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
    data:[],
    totalCount:0
};
plv8.subtransaction(function() {
  const {
    teamMemberId,
  } = input_data;
  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || member[0].alliance_member_role !== 'MEMBER' || member[0].   alliance_member_role !== 'MERCHANT') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const earnings = plv8.execute(`
    SELECT *
    FROM alliance_earnings_table
    WHERE alliance_earnings_member_id = $1
  `,[teamMemberId]);
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_total_referral(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = {
  data: 0,
  totalCount: 0,
  success: true,
  message: 'Data fetched successfully',
};
plv8.subtransaction(function() {
  const { teamMemberId } = input_data;

  if (!teamMemberId) {
    returnData = { success: false, message: 'teamMemberId is required' };
    return;
  }

  const member = plv8.execute(
    `SELECT alliance_member_role
     FROM alliance_schema.alliance_member_table
     WHERE alliance_member_id = $1`,
    [teamMemberId]
  );

  if (!member.length || member[0].alliance_member_role !== 'ADMIN') {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const directReferrals = plv8.execute(
    `SELECT alliance_referral_member_id
     FROM alliance_schema.alliance_referral_table
     WHERE alliance_referral_from_member_id = $1`,
    [teamMemberId]
  ).map((ref) => ref.alliance_referral_member_id);

  let indirectReferrals = new Set();
  let currentLevelReferrals = [teamMemberId];
  let currentLevel = 0;
  const maxLevel = 9;

  while (currentLevel < maxLevel && currentLevelReferrals.length > 0) {
    const referrerData = plv8.execute(
      `SELECT ar.alliance_referral_hierarchy
       FROM alliance_schema.alliance_referral_table ar
       JOIN alliance_schema.alliance_referral_link_table al
         ON al.alliance_referral_link_id = ar.alliance_referral_link_id
       WHERE al.alliance_referral_link_member_id = ANY($1)`,
      [currentLevelReferrals]
    );

    let nextLevelReferrals = [];

    referrerData.forEach((ref) => {
      const hierarchyArray = ref.alliance_referral_hierarchy.split('.').slice(1);

      hierarchyArray.forEach((id) => {
        if (!indirectReferrals.has(id) && id !== teamMemberId) {
          indirectReferrals.add(id);
          nextLevelReferrals.push(id);
        }
      });
    });

    currentLevelReferrals = nextLevelReferrals;
    currentLevel++;
  }

  indirectReferrals = Array.from(indirectReferrals).filter(
    (id) => !directReferrals.includes(id)
  );

  let totalDirectBounty = 0;
  if (directReferrals.length > 0) {
    totalDirectBounty = plv8.execute(
      `SELECT COALESCE(SUM(package_ally_bounty_earnings), 0) AS total_bounty
       FROM packages_schema.package_ally_bounty_log
       WHERE package_ally_bounty_member_id = ANY($1)`,
      [directReferrals]
    )[0].total_bounty;
  }


  let totalIndirectBounty = 0;
  if (indirectReferrals.length > 0) {
    totalIndirectBounty = plv8.execute(
      `SELECT COALESCE(SUM(package_ally_bounty_earnings), 0) AS total_bounty
       FROM packages_schema.package_ally_bounty_log
       WHERE package_ally_bounty_member_id = ANY($1)`,
      [indirectReferrals]
    )[0].total_bounty;
  }

  returnData = totalDirectBounty;
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_user_options(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = [];
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 10,
    teamMemberId
  } = input_data;

  const member = plv8.execute(
    `
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
    `,
    [teamMemberId]
  );

  if (!member.length || (member[0].alliance_member_role !== 'ADMIN' && member[0].alliance_member_role !== 'MERCHANT' && member[0].alliance_member_role !== 'ACCOUNTING')) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const offset = (page - 1) * limit;

  const userData = plv8.execute(
    `
    SELECT 
      user_id,
      user_username
    FROM user_schema.user_table
    JOIN alliance_schema.alliance_member_table
    ON alliance_member_user_id = user_id
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  returnData = userData;
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_user_options_merchant(
    input_data JSON
)
RETURNS JSON
SET search_path TO ''
AS $$
let returnData = [];
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 10,
    teamMemberId
  } = input_data;

  const member = plv8.execute(
    `
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
    `,
    [teamMemberId]
  );

  if (!member.length || (member[0].alliance_member_role !== 'ADMIN' && member[0].alliance_member_role !== 'MERCHANT')) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const offset = (page - 1) * limit;

  const userData = plv8.execute(
    `
    SELECT 
      user_id,
      user_username
    FROM user_schema.user_table
    JOIN alliance_schema.alliance_member_table
    ON alliance_member_user_id = user_id
    WHERE alliance_member_role = 'MERCHANT'
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  returnData = userData;
});
return returnData;
$$ LANGUAGE plv8;

CREATE INDEX idx_alliance_top_up_request_member_id
ON alliance_schema.alliance_top_up_request_table (alliance_top_up_request_member_id);

CREATE INDEX idx_merchant_member_id
ON merchant_schema.merchant_member_table (merchant_member_id);
-- package_table
CREATE INDEX idx_package_id ON packages_schema.package_table (package_id);

-- alliance_earnings_table
CREATE INDEX idx_alliance_earnings_member_id ON alliance_schema.alliance_earnings_table (alliance_earnings_member_id);

-- alliance_referral_table
CREATE INDEX idx_alliance_referral_member_id ON alliance_schema.alliance_referral_table (alliance_referral_member_id);

-- package_member_connection_table

-- package_ally_bounty_log
CREATE INDEX idx_package_ally_bounty_member_id ON packages_schema.package_ally_bounty_log (package_ally_bounty_member_id);
CREATE INDEX idx_package_ally_bounty_connection_id ON packages_schema.package_ally_bounty_log (package_ally_bounty_connection_id);

-- alliance_member_table
CREATE INDEX idx_alliance_member_id ON alliance_schema.alliance_member_table (alliance_member_id);


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

