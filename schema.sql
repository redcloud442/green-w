

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
    url,
    iv
  } = input_data;



  if (referalLink) {

      if (!email || !password) {
    throw new Error('Both email and password are required to create a user.');
  }
  
  const DEFAULT_ALLIANCE_ID = '35f77cd9-636a-41fa-a346-9cb711e7a338';


  const insertUserQuery = `
    INSERT INTO user_schema.user_table (user_id, user_email, user_password, user_iv, user_first_name, user_last_name, user_username)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING user_id, user_email
  `;
  const result = plv8.execute(insertUserQuery, [userId, email, password, iv, firstName, lastName, userName]);

  if (!result || result.length === 0) {
    throw new Error('Failed to create user');
  }


  const allianceMemberId = plv8.execute(`
    INSERT INTO alliance_schema.alliance_member_table (alliance_member_role, alliance_member_alliance_id, alliance_member_user_id)
    VALUES ($1, $2, $3)
    RETURNING alliance_member_id
  `, ['MEMBER', DEFAULT_ALLIANCE_ID, userId])[0].alliance_member_id;

  plv8.execute(`
C    INSERT INTO alliance_schema.alliance_earnings_table (alliance_earnings_member_id)
    VALUES ($1)
  `, [allianceMemberId]);


  const referralLinkURL = `${url}?referralLink=${encodeURIComponent(userName)}`;
  plv8.execute(`
    INSERT INTO alliance_schema.alliance_referral_link_table (alliance_referral_link, alliance_referral_link_member_id)
    VALUES ($1, $2)
  `, [referralLinkURL, allianceMemberId]);


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


CREATE OR REPLACE FUNCTION get_admin_top_up_history(
  input_data JSON
)
RETURNS JSON
AS $$
let returnData = {
  data: [],
  totalCount: 0
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


  const member = plv8.execute(
    `
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
    `,
    [teamMemberId]
  );

  if (!member.length || (member[0].alliance_member_role !== 'ADMIN')) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }

  const offset = (page - 1) * limit;
  const sortBy = isAscendingSort ? "DESC" : "ASC";
  const sortCondition = columnAccessor
    ? `ORDER BY "${columnAccessor}" ${sortBy}`
    : "";
  const merchantCondition = merchantFilter ? `AND approver.user_id = '${merchantFilter}'` : "";
  const userCondition = userFilter ? `AND u.user_username = '${userFilter} OR u.user_id = '${userFilter} OR u.user_first_name = '${userFilter}' OR u.user_last_name = '${userFilter}'` : "";
  const statusCondition = statusFilter ? `AND t.alliance_top_up_request_status = '${statusFilter}'`: "";
  const dateFilterCondition = dateFilter.start && dateFilter.end ? `AND t.alliance_top_up_request_date BETWEEN '${dateFilter.start}' AND '${dateFilter.end}'` : "";
  let searchCondition = '';
  const params = [teamId, limit, offset];

  if (search) {
    searchCondition = `AND u.user_username ILIKE '%${search}%'`

  }

  const topUpRequest = plv8.execute(
    `
    SELECT
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
    `,
    params
  );

  const totalCount = plv8.execute(
    `
    SELECT COUNT(*)
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
    `,
    [teamId]
  )[0].count;

  returnData.data = topUpRequest;
  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_member_withdrawal_history(
  input_data JSON
)
RETURNS JSON
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
    isAscendingSort
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || !["MEMBER","MERCHANT","ACCOUNTING"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }
  const offset = (page - 1) * limit;

  const params = [teamId,teamMemberId, limit, offset];

  const searchCondition = search ? `AND t.alliance_withdrawal_request_id = '${search}'`: "";
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

CREATE OR REPLACE FUNCTION get_admin_withdrawal_history(
  input_data JSON
)
RETURNS JSON
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
  const userCondition = userFilter ? `AND u.user_username = '${userFilter} OR u.user_id = '${userFilter} OR u.user_first_name = '${userFilter}' OR u.user_last_name = '${userFilter}'` : "";
  const statusCondition = statusFilter ? `AND t.alliance_withdrawal_request_status = '${statusFilter}'`: "";
  const dateFilterCondition = dateFilter.start && dateFilter.end ? `AND t.alliance_withdrawal_request_date BETWEEN '${dateFilter.start}' AND '${dateFilter.end}'` : "";
  const searchCondition = search ? `AND t.alliance_withdrawal_request_id = '${search}'`: "";
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

    const totalCount = plv8.execute(`
        SELECT
            COUNT(*)
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
        ${searchCondition}
        ${userCondition}
        ${statusCondition}
        ${dateFilterCondition}
  `,[teamId])[0].count;

  returnData.data = topUpRequest;
  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_accountant_withdrawal_history(
  input_data JSON
)
RETURNS JSON
AS $$
let returnData = {
    data:[],
    totalCount:0,
    count:{}
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
  const userCondition = userFilter ? `AND u.user_username = '${userFilter} OR u.user_id = '${userFilter} OR u.user_first_name = '${userFilter}' OR u.user_last_name = '${userFilter}'` : "";
  const statusCondition = statusFilter ? `AND t.alliance_withdrawal_request_status = '${statusFilter}'`: "";
  const dateFilterCondition = dateFilter.start && dateFilter.end ? `AND t.alliance_withdrawal_request_date BETWEEN '${dateFilter.start}' AND '${dateFilter.end}'` : "";
  const searchCondition = search ? `AND t.alliance_withdrawal_request_id = '${search}'`: "";
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

    const totalCount = plv8.execute(`
        SELECT
            COUNT(*)
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
        ${searchCondition}
        ${userCondition}
        ${statusCondition}
        ${dateFilterCondition}
  `,[teamId])[0].count;

  const statusCount = plv8.execute(
    `
   SELECT
    t.alliance_withdrawal_request_status AS status,
    COUNT(*) AS count
  FROM alliance_schema.alliance_withdrawal_request_table t
  JOIN alliance_schema.alliance_member_table m ON t.alliance_withdrawal_request_member_id = m.alliance_member_id
  JOIN user_schema.user_table u ON u.user_id = m.alliance_member_user_id
  LEFT JOIN alliance_schema.alliance_member_table mt ON mt.alliance_member_id = t.alliance_withdrawal_request_approved_by
  LEFT JOIN
    user_schema.user_table approver ON approver.user_id = mt.alliance_member_user_id
 WHERE m.alliance_member_alliance_id = $1
 GROUP BY t.alliance_withdrawal_request_status
 ORDER BY t.alliance_withdrawal_request_status DESC 
    `,
    [teamId]
  );

  const countObj = {
    REJECTED: 0,
    APPROVED: 0,
    PENDING: 0
  };

  statusCount.forEach(item => {
    countObj[item.status] = Number(item.count);
  });

  returnData.data = topUpRequest;
  returnData.totalCount = Number(totalCount);
  returnData.count = countObj;
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_member_top_up_history(
  input_data JSON
)
RETURNS JSON
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
    isAscendingSort
  } = input_data;

  const member = plv8.execute(`
    SELECT alliance_member_role
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_id = $1
  `, [teamMemberId]);

  if (!member.length || !["MEMBER","MERCHANT","ACCOUNTING"].includes(member[0].alliance_member_role)) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }
  const offset = (page - 1) * limit;

  const params = [teamId,teamMemberId, limit, offset];

  const searchCondition = search ? `AND t.alliance_top_up_request_id = '${search}'`: "";
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
  `,[teamId,teamMemberId])[0].count;

  returnData.data = topUpRequest;
  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_merchant_top_up_history(
  input_data JSON
)
RETURNS JSON
AS $$
let returnData = {
  data: [],
  totalCount: 0,
  count:{},
  merchantBalance:0
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
  }

  const offset = (page - 1) * limit;
  const sortBy = isAscendingSort ? "DESC" : "ASC";
  const sortCondition = columnAccessor
    ? `ORDER BY "${columnAccessor}" ${sortBy}`
    : "";
  const merchantCondition = merchantFilter ? `AND approver.user_id = '${merchantFilter}'` : "";
  const userCondition = userFilter ? `AND u.user_username = '${userFilter} OR u.user_id = '${userFilter} OR u.user_first_name = '${userFilter}' OR u.user_last_name = '${userFilter}'` : "";
  const statusCondition = statusFilter ? `AND t.alliance_top_up_request_status = '${statusFilter}'`: "";
  const dateFilterCondition = dateFilter.start && dateFilter.end ? `AND t.alliance_top_up_request_date BETWEEN '${dateFilter.start}' AND '${dateFilter.end}'` : "";
  let searchCondition = '';
  const params = [teamId, limit, offset];

  if (search) {
    searchCondition = `AND u.user_username ILIKE '%${search}%'`

  }

  const topUpRequest = plv8.execute(
    `
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
    `,
    params
  );

  const totalCount = plv8.execute(
    `
    SELECT COUNT(*)
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
    `,
    [teamId]
  )[0].count;

  const statusCount = plv8.execute(
    `
   SELECT
    t.alliance_top_up_request_status AS status,
    COUNT(*) AS count
  FROM alliance_schema.alliance_top_up_request_table t
  JOIN alliance_schema.alliance_member_table m ON t.alliance_top_up_request_member_id = m.alliance_member_id
  JOIN user_schema.user_table u ON u.user_id = m.alliance_member_user_id
  LEFT JOIN alliance_schema.alliance_member_table mt ON mt.alliance_member_id = t.alliance_top_up_request_approved_by
  LEFT JOIN
    user_schema.user_table approver ON approver.user_id = mt.alliance_member_user_id
 WHERE m.alliance_member_alliance_id = $1
 GROUP BY t.alliance_top_up_request_status
 ORDER BY t.alliance_top_up_request_status DESC 
    `,
    [teamId]
  );

  const merchantBalance = plv8.execute(`
    SELECT merchant_member_balance
    FROM merchant_schema.merchant_member_table
    WHERE merchant_member_merchant_id = $1
  `,[teamMemberId])[0].merchant_member_balance;

  const countObj = {
    REJECTED: 0,
    APPROVED: 0,
    PENDING: 0
  };

  statusCount.forEach(item => {
    countObj[item.status] = Number(item.count);
  });

  returnData.data = topUpRequest;
  returnData.totalCount = Number(totalCount);
  returnData.count = countObj;
  returnData.merchantBalance = merchantBalance
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_admin_withdrawal_history(
  input_data JSON
)
RETURNS JSON
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
  const userCondition = userFilter ? `AND u.user_username = '${userFilter} OR u.user_id = '${userFilter} OR u.user_first_name = '${userFilter}' OR u.user_last_name = '${userFilter}'` : "";
  const statusCondition = statusFilter ? `AND t.alliance_withdrawal_request_status = '${statusFilter}'`: "";
  const dateFilterCondition = dateFilter.start && dateFilter.end ? `AND t.alliance_withdrawal_request_date BETWEEN '${dateFilter.start}' AND '${dateFilter.end}'` : "";
  const searchCondition = search ? `AND t.alliance_withdrawal_request_id = '${search}'`: "";
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

    const totalCount = plv8.execute(`
        SELECT
            COUNT(*)
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
        ${searchCondition}
        ${userCondition}
        ${statusCondition}
        ${dateFilterCondition}
  `,[teamId])[0].count;

  returnData.data = topUpRequest;
  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_total_earnings(
  input_data JSON
)
RETURNS JSON
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

CREATE OR REPLACE FUNCTION get_admin_user_data(
  input_data JSON
)
RETURNS JSON
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
    dateCreated
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
  `,[teamId])[0].count;

  returnData.data = userRequest;
  returnData.totalCount = Number(totalCount);
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_ally_bounty(
  input_data JSON
)
RETURNS JSON
AS $$
let returnData = {
    data: [],
    totalCount: 0
};
plv8.subtransaction(function() {
  const {
    page = 1,
    limit = 13,
    search = '',
    teamMemberId,
    teamId,
    columnAccessor,
    isAscendingSort
  } = input_data;

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

  const params = [directReferrals, limit, offset];
  const searchCondition = search ? `AND u.user_first_name ILIKE '%${search}%' OR u.user_last_name ILIKE '%${search}%' OR u.user_username ILIKE '%${search}%'` : '';

  const sortBy = isAscendingSort ? "ASC" : "DESC";
  const sortCondition = columnAccessor
    ? `ORDER BY "${columnAccessor}" ${sortBy}`
    : '';

  const userRequest = plv8.execute(
    `SELECT
       u.user_first_name,
       u.user_last_name,
       u.user_username
     FROM alliance_schema.alliance_member_table m
     JOIN user_schema.user_table u
       ON u.user_id = m.alliance_member_user_id
     WHERE m.alliance_member_id = ANY($1)
     ${searchCondition}
     ${sortCondition}
     LIMIT $2 OFFSET $3`,
    params
  );

  const totalCount = plv8.execute(
    `SELECT COUNT(*)
     FROM alliance_schema.alliance_member_table m
     JOIN user_schema.user_table u
       ON u.user_id = m.alliance_member_user_id
     WHERE m.alliance_member_id = ANY($1)
     ${searchCondition}`,
    [directReferrals]
  )[0].count;

  returnData.data = userRequest;
  returnData.totalCount = Number(totalCount);
});

return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_direct_sponsor(
  input_data JSON
)
RETURNS TEXT
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

CREATE OR REPLACE FUNCTION get_legion_bounty(input_data JSON)
RETURNS JSON
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
    columnAccessor = 'user_first_name',
    isAscendingSort = true,
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
    [teamMemberId]
  ).map((ref) => ref.alliance_referral_member_id);

  let indirectReferrals = new Set();
  let currentLevelReferrals = [teamMemberId];
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

  if (!indirectReferrals.length) {
    returnData = { success: false, message: 'No referral data found' };
    return;
  }

  const offset = Math.max((page - 1) * limit, 0);
  let params = [indirectReferrals, teamMemberId, limit, offset];
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
      COALESCE(SUM(pa.package_ally_bounty_earnings), 0) AS total_bounty_earnings
    FROM alliance_schema.alliance_member_table am
    JOIN user_schema.user_table ut
      ON ut.user_id = am.alliance_member_user_id
    JOIN packages_schema.package_ally_bounty_log pa
      ON am.alliance_member_id = pa.package_ally_bounty_from
    WHERE pa.package_ally_bounty_from  = ANY($1)
      AND pa.package_ally_bounty_member_id = $2
      ${searchCondition}
    GROUP BY 
      ut.user_first_name, 
      ut.user_last_name, 
      ut.user_username, 
      ut.user_date_created,
      am.alliance_member_id
    ORDER BY ${columnAccessor} ${isAscendingSort ? 'ASC' : 'DESC'}
    LIMIT $3 OFFSET $4
    `,
    params
  );

  const totalCountResult = plv8.execute(
    `
    SELECT COUNT(*)
    FROM alliance_schema.alliance_member_table am
    JOIN user_schema.user_table ut
      ON ut.user_id = am.alliance_member_user_id
    WHERE am.alliance_member_id = ANY($1)
      ${searchCondition}
    `,
    [indirectReferrals]
  );

  // Set the result data
  returnData.data = indirectReferralDetails;
  returnData.totalCount = Number(totalCountResult[0].count);
});

return returnData;
$$ LANGUAGE plv8;



CREATE OR REPLACE FUNCTION get_total_referral(input_data JSON)
RETURNS JSON
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

  // Get direct referrals
  const directReferrals = plv8.execute(
    `SELECT alliance_referral_member_id
     FROM alliance_schema.alliance_referral_table
     WHERE alliance_referral_from_member_id = $1`,
    [teamMemberId]
  ).map((ref) => ref.alliance_referral_member_id);

  // Get indirect referrals
  let indirectReferrals = new Set();
  let currentLevelReferrals = [teamMemberId];
  let currentLevel = 0;
  const maxLevel = 11;

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


CREATE OR REPLACE FUNCTION get_admin_dashboard_data(
  input_data JSON
)
RETURNS JSON
AS $$
let returnData = {
  totalEarnings: 0,
  totalWithdraw: 0,
  directLoot: 0,
  indirectLoot: 0,
  activePackageWithinTheDay: 0,
  numberOfRegisteredUser: 0,
  totalActivatedPackage: 0,
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

  const totalEarnings = plv8.execute(`
    SELECT COALESCE(SUM(package_member_amount), 0) AS total_earnings
    FROM packages_schema.package_member_connection_table
    WHERE package_member_connection_created BETWEEN $1 AND $2
  `, [startDate, endDate])[0];


  const totalWithdraw = plv8.execute(`
    SELECT COALESCE(SUM(alliance_withdrawal_request_amount), 0) AS total_withdraw
    FROM alliance_schema.alliance_withdrawal_request_table
    WHERE alliance_withdrawal_request_status = 'APPROVED'
      AND alliance_withdrawal_request_date BETWEEN $1 AND $2
  `, [startDate, endDate])[0];

  const directAndIndirectLoot = plv8.execute(`
    SELECT  
      COALESCE(SUM(CASE WHEN package_ally_bounty_type = 'DIRECT' THEN package_ally_bounty_earnings ELSE 0 END), 0) AS direct_loot,
      COALESCE(SUM(CASE WHEN package_ally_bounty_type = 'INDIRECT' THEN package_ally_bounty_earnings ELSE 0 END), 0) AS indirect_loot
    FROM packages_schema.package_ally_bounty_log
    WHERE package_ally_bounty_log_date_created BETWEEN $1 AND $2
  `, [startDate, endDate])[0];


  const activePackageWithinTheDay = plv8.execute(`
    SELECT COUNT(*) AS active_packages
    FROM alliance_schema.alliance_member_table
    WHERE alliance_member_date_updated BETWEEN $1 AND $2
      AND alliance_member_is_active = true
  `, [startDate, endDate])[0].active_packages;


  const totalActivatedPackage = plv8.execute(`
    SELECT COUNT(*) AS activated_packages
    FROM packages_schema.package_member_connection_table
    WHERE package_member_status = 'ACTIVE'
  `)[0].activated_packages;


  const numberOfRegisteredUser = plv8.execute(`
    SELECT COUNT(*) AS registered_users
    FROM alliance_schema.alliance_member_table
  `)[0].registered_users;


  const chartData = plv8.execute(`
    WITH
      daily_earnings AS (
        SELECT
          DATE_TRUNC('day', package_member_connection_created) AS date,
          SUM(package_member_amount) AS earnings
        FROM packages_schema.package_member_connection_table
        WHERE package_member_connection_created BETWEEN $1 AND $2
          AND package_member_status = 'ENDED'
        GROUP BY DATE_TRUNC('day', package_member_connection_created)
      ),
      daily_withdraw AS (
        SELECT
          DATE_TRUNC('day', alliance_withdrawal_request_date) AS date,
          SUM(alliance_withdrawal_request_amount) AS withdraw
        FROM alliance_schema.alliance_withdrawal_request_table
        WHERE alliance_withdrawal_request_date BETWEEN $1 AND $2
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
  returnData.numberOfRegisteredUser = Number(numberOfRegisteredUser);
  returnData.totalActivatedPackage = Number(totalActivatedPackage);
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
plv8.subtransaction(function() {
 
let returnData = [];
let totalCompletedAmount = 0; // Variable to track the total amount of 100% packages

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
      p.packages_days::INTEGER AS packages_days,
      pmc.package_member_status,
      pmc.package_member_connection_created::TEXT AS package_member_connection_created,
      (pmc.package_member_connection_created + (p.packages_days || ' days')::INTERVAL)::TEXT AS completion_date,
      (pmc.package_member_amount + pmc.package_amount_earnings) AS amount,
      pmc.package_member_connection_id,
      pmc.package_member_package_id,
      pmc.package_member_member_id,
      pmc.package_member_amount,
      pmc.package_amount_earnings
    FROM packages_schema.package_member_connection_table pmc
    JOIN packages_schema.package_table p
      ON pmc.package_member_package_id = p.package_id
    WHERE pmc.package_member_status = $1 AND pmc.package_member_member_id = $2
    ORDER BY pmc.package_member_connection_created DESC`,
    ['ACTIVE', teamMemberId]
  );

  returnData = chartData.reduce((acc, row) => {
    const startDate = new Date(row.package_member_connection_created);
    const completionDate = new Date(row.completion_date);

    if (isNaN(startDate.getTime()) || isNaN(completionDate.getTime())) {
      plv8.elog(NOTICE, `Invalid dates detected.`);
      return acc;
    }

    const elapsedTimeMs = Math.max(currentTimestamp - startDate, 0);
    const totalTimeMs = Math.max(completionDate - startDate, 0);

    const percentage = totalTimeMs > 0
      ? parseFloat(((elapsedTimeMs / totalTimeMs) * 100).toFixed(2))
      : 100.0;

    if (percentage >= 100) {
      const earnings = row.amount;
      totalCompletedAmount += earnings; // Add completed package amount to the total

      plv8.execute(
        `UPDATE alliance_schema.alliance_earnings_table
         SET alliance_olympus_earnings = alliance_olympus_earnings + $1
         WHERE alliance_earnings_member_id = $2`,
        [earnings, row.package_member_member_id]
      );

      plv8.execute(
        `UPDATE packages_schema.package_member_connection_table
         SET package_member_status = 'ENDED'
         WHERE package_member_connection_id = $1`,
        [row.package_member_connection_id]
      );

      plv8.execute(
        `INSERT INTO packages_schema.package_earnings_log (
          package_member_connection_id,
          package_member_package_id,
          package_member_member_id,
          package_member_connection_created,
          package_member_amount,
          package_member_amount_earnings,
          package_member_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'ENDED'
        )`,
        [
          row.package_member_connection_id,
          row.package_member_package_id,
          row.package_member_member_id,
          row.package_member_connection_created,
          row.package_member_amount,
          row.package_amount_earnings
        ]
      );
      return acc;
    }

    acc.push({
      package: row.package,
      completion_date: completionDate.toISOString(),
      amount: parseFloat(row.amount),
      completion: percentage,
    });

    return acc;
  }, []);
});

// Add the totalCompletedAmount to returnData
returnData = {
  success: true,
  data: returnData,
  totalCompletedAmount,
};

return returnData;
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_member_package_history(
  input_data JSON
)
RETURNS JSON
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


CREATE OR REPLACE FUNCTION get_history_log(
  input_data JSON
)
RETURNS JSON
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
  const sortBy = isAscendingSort ? "ASC" : "DESC";

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

CREATE OR REPLACE FUNCTION get_packages_admin(
  input_data JSON
)
RETURNS JSON
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

CREATE OR REPLACE FUNCTION get_user_options(
  input_data JSON
)
RETURNS JSON
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

CREATE OR REPLACE FUNCTION get_merchant_option(
  input_data JSON
)
SET search_path TO ''
RETURNS JSON
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
    SELECT *
    FROM merchant_schema.merchant_table
    `
  );

  returnData = merchant
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_merchant_data(
  input_data JSON
)
RETURNS JSON
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

CREATE OR REPLACE FUNCTION get_dashboard_earnings(
  input_data JSON
)
RETURNS JSON
AS $$
let returnData = {};
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

  if (!member.length) {
    returnData = { success: false, message: 'Unauthorized access' };
    return;
  }


  const totalEarnings = plv8.execute(
    `
    SELECT
      COALESCE(SUM(package_member_amount), 0) AS total_earnings
    FROM packages_schema.package_earnings_log
    WHERE package_member_member_id = $1
      AND package_member_status = 'ENDED'
    `,
    [teamMemberId]
  );


  const totalWithdrawals = plv8.execute(
    `
    SELECT
      COALESCE(SUM(alliance_withdrawal_request_amount), 0) AS total_withdrawal
    FROM alliance_schema.alliance_withdrawal_request_table
    WHERE alliance_withdrawal_request_member_id = $1
      AND alliance_withdrawal_request_status = 'APPROVED'
    `,
    [teamMemberId]
  );
  
  const directReferralAmount = plv8.execute(
    `
    SELECT COALESCE(SUM(package_ally_bounty_earnings), 0) AS total_bounty
    FROM packages_schema.package_ally_bounty_log
    WHERE package_ally_bounty_member_id = $1 AND package_ally_bounty_type = 'DIRECT'
    `,
    [teamMemberId]
  );


    const indirectReferralAmount = plv8.execute(
    `
    SELECT COALESCE(SUM(package_ally_bounty_earnings), 0) AS total_bounty 
    FROM packages_schema.package_ally_bounty_log
    WHERE package_ally_bounty_member_id = $1 AND package_ally_bounty_type = 'INDIRECT'
    `,
    [teamMemberId]
  );

  returnData = {
    totalEarnings: totalEarnings[0]?.total_earnings || 0,
    withdrawalAmount: totalWithdrawals[0]?.total_withdrawal || 0,
    directReferralAmount: directReferralAmount[0]?.total_bounty || 0,
    indirectReferralAmount: indirectReferralAmount[0]?.total_bounty || 0
  };
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_package_modal_data(
  input_data JSON
)
RETURNS JSON
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
    WHERE package_is_disabled = false
  `);

  returnData = packageData
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_merchant_option(
  input_data JSON
)
SET search_path TO ''
RETURNS JSON
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
    SELECT *
    FROM merchant_schema.merchant_table
    `
  );

  returnData = merchant
});
return returnData;
$$ LANGUAGE plv8;


CREATE OR REPLACE FUNCTION get_earnings_modal_data(
  input_data JSON
)
RETURNS JSON
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
    SELECT *
    FROM alliance_schema.alliance_earnings_table
    WHERE alliance_earnings_member_id = $1
  `, [teamMemberId])[0];

  returnData = earningsData
});
return returnData;
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION get_leaderboard_data(input_data JSON)
RETURNS JSON
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

  const query = `
    SELECT 
      user_username,
      SUM(package_ally_bounty_earnings) AS totalAmount
    FROM packages_schema.package_ally_bounty_log
    JOIN alliance_schema.alliance_member_table
      ON package_ally_bounty_member_id = alliance_member_id
    JOIN user_schema.user_table
      ON alliance_member_user_id = user_id
    WHERE package_ally_bounty_type = $1
    GROUP BY user_username
    ORDER BY totalAmount DESC
    LIMIT $2 OFFSET $3
  `;

  const leaderBoardData = plv8.execute(query, [leaderBoardType, limit, offset]);

  const totalCountQuery = `
    SELECT COUNT(DISTINCT package_ally_bounty_member_id) AS totalCount
    FROM packages_schema.package_ally_bounty_log
    WHERE package_ally_bounty_type = $1
  `;

  const totalCountResult = plv8.execute(totalCountQuery, [leaderBoardType]);
  const totalCount = parseInt(totalCountResult[0].totalcount);

  returnData = {
    totalCount,
    data: leaderBoardData.map(row => ({
      username: row.user_username,
      totalAmount: parseFloat(row.totalamount)
    }))
  };
});
return returnData;
$$ LANGUAGE plv8;


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




CREATE OR REPLACE FUNCTION update_earnings_based_on_packages()
RETURNS void AS $$
  var results = plv8.execute(`
   SELECT
  pmct.package_member_connection_id,
  pmct.package_member_package_id,
  pmct.package_member_member_id,
  pmct.package_member_amount,
  pmct.package_amount_earnings,
  pmct.package_member_connection_created,
  p.package_percentage,
  p.packages_days
    FROM packages_schema.package_member_connection_table pmct
    JOIN packages_schema.package_table p
    ON pmct.package_member_package_id = p.package_id
    WHERE now() >= pmct.package_member_connection_created + (p.packages_days || ' days')::interval
    AND pmct.package_member_status = 'ACTIVE';
    `);

  results.forEach(row => {
    var earnings = row.package_member_amount + row.package_amount_earnings;
    plv8.execute(`
      UPDATE alliance_schema.alliance_earnings_table
      SET alliance_olympus_earnings = alliance_olympus_earnings + $1
      WHERE alliance_earnings_member_id = $2
    `, [earnings, row.package_member_member_id]);

    plv8.execute(`
      UPDATE packages_schema.package_member_connection_table
      SET package_member_status = 'ENDED'
      WHERE package_member_connection_id = $1
    `, [row.package_member_connection_id]);

    plv8.execute(`
      INSERT INTO packages_schema.package_earnings_log (
        package_earnings_log_id,
        package_member_connection_id,
        package_member_package_id,
        package_member_member_id,
        package_member_connection_created,
        package_member_amount,
        package_member_amount_earnings,
        package_member_status
      ) VALUES (
        uuid_generate_v4(), -- Generate a new UUID
        $1, $2, $3, $4, $5,$6, 'ENDED'
      )
    `, [
      row.package_member_connection_id,
      row.package_member_package_id,
      row.package_member_member_id,
      row.package_member_connection_created,
      row.package_member_amount,
      row.package_amount_earnings
    ]);
  });
$$ LANGUAGE plv8;

SELECT cron.schedule(
    'update_packages_job',
    '0 0,12 * * *',
    $$SELECT public.update_earnings_based_on_packages()$$ -- Command to execute
);

---rls---
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