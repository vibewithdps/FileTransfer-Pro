/*
==========================================================
                FileTransfer Pro v2
----------------------------------------------------------
User Model
Created By DPS
Version : 2.0.0
==========================================================
*/

"use strict";

const database = require("../database/database");

/*=========================================================
                Create User
=========================================================*/

function create(data) {

    const sql = `

        INSERT INTO users
        (
            username,
            email,
            password,
            avatar
        )

        VALUES
        (
            ?, ?, ?, ?
        )

    `;

    const result = database.execute(

        sql,

        [

            data.username,

            data.email,

            data.password,

            data.avatar || null

        ]

    );

    return result.lastInsertRowid;

}

/*=========================================================
                Find By ID
=========================================================*/

function findById(id) {

    return database.get(

        `

        SELECT
            id,
            username,
            email,
            avatar,
            created_at

        FROM users

        WHERE id = ?

        `,

        [id]

    );

}

/*=========================================================
                Find By Username
=========================================================*/

function findByUsername(username) {

    return database.get(

        `

        SELECT *

        FROM users

        WHERE username = ?

        `,

        [username]

    );

}

/*=========================================================
                Find By Email
=========================================================*/

function findByEmail(email) {

    return database.get(

        `

        SELECT *

        FROM users

        WHERE email = ?

        `,

        [email]

    );

}

/*=========================================================
                Get All Users
=========================================================*/

function findAll() {

    return database.all(

        `

        SELECT

            id,
            username,
            email,
            avatar,
            created_at

        FROM users

        ORDER BY created_at DESC

        `

    );

}

/*=========================================================
                Count Users
=========================================================*/

function count() {

    return database.get(

        `

        SELECT COUNT(*) AS total

        FROM users

        `

    ).total;

}

/*=========================================================
                Update Profile
=========================================================*/

function update(id, data) {

    return database.execute(

        `

        UPDATE users

        SET

            username = ?,

            email = ?,

            avatar = ?

        WHERE id = ?

        `,

        [

            data.username,

            data.email,

            data.avatar || null,

            id

        ]

    );

}

/*=========================================================
                Update Password
=========================================================*/

function updatePassword(

    id,

    password

) {

    return database.execute(

        `

        UPDATE users

        SET password = ?

        WHERE id = ?

        `,

        [

            password,

            id

        ]

    );

}

/*=========================================================
                Update Avatar
=========================================================*/

function updateAvatar(

    id,

    avatar

) {

    return database.execute(

        `

        UPDATE users

        SET avatar = ?

        WHERE id = ?

        `,

        [

            avatar,

            id

        ]

    );

}

/*=========================================================
                Delete User
=========================================================*/

function remove(id) {

    return database.execute(

        `

        DELETE FROM users

        WHERE id = ?

        `,

        [

            id

        ]

    );

}

/*=========================================================
                Search Users
=========================================================*/

function search(keyword) {

    return database.all(

        `

        SELECT

            id,

            username,

            email,

            avatar,

            created_at

        FROM users

        WHERE

            username LIKE ?

            OR

            email LIKE ?

        ORDER BY created_at DESC

        `,

        [

            `%${keyword}%`,

            `%${keyword}%`

        ]

    );

}

/*=========================================================
                Recent Users
=========================================================*/

function recent(

    limit = 10

) {

    return database.all(

        `

        SELECT

            id,

            username,

            email,

            avatar,

            created_at

        FROM users

        ORDER BY created_at DESC

        LIMIT ?

        `,

        [

            limit

        ]

    );

}

/*=========================================================
                User Statistics
=========================================================*/

function statistics() {

    return database.get(

        `

        SELECT

            COUNT(*) AS totalUsers,

            COUNT(email) AS emailUsers

        FROM users

        `

    );

}

/*=========================================================
                Check Username Exists
=========================================================*/

function usernameExists(

    username

) {

    return !!database.get(

        `

        SELECT id

        FROM users

        WHERE username = ?

        `,

        [

            username

        ]

    );

}

/*=========================================================
                Check Email Exists
=========================================================*/

function emailExists(

    email

) {

    return !!database.get(

        `

        SELECT id

        FROM users

        WHERE email = ?

        `,

        [

            email

        ]

    );

}

/*=========================================================
                Public Profile
=========================================================*/

function publicProfile(id) {

    return database.get(

        `

        SELECT

            id,

            username,

            avatar,

            created_at

        FROM users

        WHERE id = ?

        `,

        [

            id

        ]

    );

}

/*=========================================================
                Verify Login
=========================================================*/

function verifyLogin(login) {

    return database.get(

        `

        SELECT *

        FROM users

        WHERE

            username = ?

            OR

            email = ?

        LIMIT 1

        `,

        [

            login,

            login

        ]

    );

}

/*=========================================================
                Registration Statistics
=========================================================*/

function registrationStatistics() {

    return database.all(

        `

        SELECT

            DATE(created_at) AS day,

            COUNT(*) AS users

        FROM users

        GROUP BY DATE(created_at)

        ORDER BY DATE(created_at) DESC

        LIMIT 30

        `

    );

}

/*=========================================================
                Bulk Import Users
=========================================================*/

function bulkInsert(users) {

    const insert = database.db.prepare(`

        INSERT INTO users

        (

            username,

            email,

            password,

            avatar

        )

        VALUES

        (?, ?, ?, ?)

    `);

    const transaction = database.transaction(

        (records) => {

            for (const user of records) {

                insert.run(

                    user.username,

                    user.email,

                    user.password,

                    user.avatar || null

                );

            }

        }

    );

    transaction(users);

}

/*=========================================================
                Delete All Users
=========================================================*/

function removeAll() {

    return database.execute(

        `

        DELETE FROM users

        `

    );

}

/*=========================================================
                Transaction Helper
=========================================================*/

function runTransaction(callback) {

    const trx = database.transaction(callback);

    return trx();

}

/*=========================================================
                Module Exports
=========================================================*/

module.exports = {

    create,

    findById,

    findByUsername,

    findByEmail,

    findAll,

    count,

    update,

    updatePassword,

    updateAvatar,

    remove,

    removeAll,

    search,

    recent,

    statistics,

    usernameExists,

    emailExists,

    publicProfile,

    verifyLogin,

    registrationStatistics,

    bulkInsert,

    runTransaction

};