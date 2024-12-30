SELECT *
FROM (
        SELECT staff.id AS id,
            ROW_NUMBER() OVER (
                PARTITION BY staff.id
                ORDER BY staff.id
            ) AS row_num,
            staff.id AS id,
            staff.username AS username,
            staff.showname AS showname,
            staff.avatar AS avatar,
            staff.officer_id AS officer_id,
            staff.phone_number AS phone_number,
            staff.order AS order,
            staff.enabled AS enabled,
            dept.name AS dept_name,
            domain.name AS domain_name
        FROM staff
            LEFT JOIN department dept ON staff.dept_id = dept.id
            LEFT JOIN department domain ON staff.domain_id = domain.id
        WHERE (
                staff.deleted_at IS NULL
                AND enabled = 'Thu Dec 26 2024 11:55:47 GMT+0800 (中国标准时间)'
                AND staff.domain_id = '784c7583-c7f3-4179-873d-f8195ccf2acf'
                AND staff.deleted_at IS NULL
            )
        ORDER BY "order" asc
    )
WHERE row_num = '1'
LIMIT 31 OFFSET 0