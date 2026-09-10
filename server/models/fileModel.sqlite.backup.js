/*
==========================================================
                FileTransfer Pro v2
----------------------------------------------------------
File Model
Created By DPS
Version : 2.0.0
==========================================================
*/

"use strict";

const database = require("../database/database");

/*=========================================================
                Create File Record
=========================================================*/

function create(data) {

    const sql = `

        INSERT INTO files

        (

            filename,

            original_name,

            size,

            type,

            hash,

            uploaded_by

        )

        VALUES

        (?, ?, ?, ?, ?, ?)

    `;

    const result = database.execute(

        sql,

        [

            data.filename,

            data.original_name,

            data.size,

            data.type,

            data.hash,

            data.uploaded_by || null

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

        SELECT *

        FROM files

        WHERE id = ?

        `,

        [id]

    );

}

/*=========================================================
                Find By Filename
=========================================================*/

function findByFilename(filename) {

    return database.get(

        `

        SELECT *

        FROM files

        WHERE filename = ?

        `,

        [filename]

    );

}

/*=========================================================
                Get All Files
=========================================================*/

function findAll() {

    return database.all(

        `

        SELECT *

        FROM files

        ORDER BY uploaded_at DESC

        `

    );

}

/*=========================================================
                Count Files
=========================================================*/

function count() {

    return database.get(

        `

        SELECT COUNT(*) AS total

        FROM files

        `

    ).total;

}

/*=========================================================
                Update File
=========================================================*/

function update(id, data) {

    const sql = `

        UPDATE files

        SET

            filename = ?,

            original_name = ?,

            size = ?,

            type = ?,

            hash = ?,

            uploaded_by = ?

        WHERE id = ?

    `;

    return database.execute(

        sql,

        [

            data.filename,

            data.original_name,

            data.size,

            data.type,

            data.hash,

            data.uploaded_by || null,

            id

        ]

    );

}

/*=========================================================
                Rename File
=========================================================*/

function rename(id, filename) {

    return database.execute(

        `

        UPDATE files

        SET filename = ?

        WHERE id = ?

        `,

        [

            filename,

            id

        ]

    );

}

/*=========================================================
                Delete File
=========================================================*/

function remove(id) {

    return database.execute(

        `

        DELETE FROM files

        WHERE id = ?

        `,

        [

            id

        ]

    );

}

/*=========================================================
                Search Files
=========================================================*/

function search(keyword) {

    return database.all(

        `

        SELECT *

        FROM files

        WHERE

            filename LIKE ?

            OR original_name LIKE ?

        ORDER BY uploaded_at DESC

        `,

        [

            `%${keyword}%`,

            `%${keyword}%`

        ]

    );

}

/*=========================================================
                Recent Uploads
=========================================================*/

function recent(limit = 10) {

    return database.all(

        `

        SELECT *

        FROM files

        ORDER BY uploaded_at DESC

        LIMIT ?

        `,

        [

            limit

        ]

    );

}

/*=========================================================
                Files By User
=========================================================*/

function findByUser(userId) {

    return database.all(

        `

        SELECT *

        FROM files

        WHERE uploaded_by = ?

        ORDER BY uploaded_at DESC

        `,

        [

            userId

        ]

    );

}

/*=========================================================
                Duplicate Hash
=========================================================*/

function findByHash(hash) {

    return database.all(

        `

        SELECT *

        FROM files

        WHERE hash = ?

        `,

        [

            hash

        ]

    );

}

/*=========================================================
                Storage Usage
=========================================================*/

function storageUsage() {

    return database.get(

        `

        SELECT

            COUNT(*) AS totalFiles,

            IFNULL(SUM(size), 0) AS totalSize

        FROM files

        `

    );

}

/*=========================================================
                File Type Statistics
=========================================================*/

function typeStatistics() {

    return database.all(

        `

        SELECT

            type,

            COUNT(*) AS total,

            IFNULL(SUM(size), 0) AS size

        FROM files

        GROUP BY type

        ORDER BY total DESC

        `

    );

}

/*=========================================================
                Upload Statistics
=========================================================*/

function uploadStatistics() {

    return database.all(

        `

        SELECT

            DATE(uploaded_at) AS day,

            COUNT(*) AS uploads

        FROM files

        GROUP BY DATE(uploaded_at)

        ORDER BY DATE(uploaded_at) DESC

        LIMIT 30

        `

    );

}

/*=========================================================
                Delete All Records
=========================================================*/

function removeAll() {

    return database.execute(

        `

        DELETE FROM files

        `

    );

}

/*=========================================================
                Bulk Insert
=========================================================*/

function bulkInsert(files) {

    const insert = database.db.prepare(`

        INSERT INTO files

        (

            filename,

            original_name,

            size,

            type,

            hash,

            uploaded_by

        )

        VALUES

        (?, ?, ?, ?, ?, ?)

    `);

    const transaction = database.transaction(

        (records) => {

            for (const file of records) {

                insert.run(

                    file.filename,

                    file.original_name,

                    file.size,

                    file.type,

                    file.hash,

                    file.uploaded_by || null

                );

            }

        }

    );

    transaction(files);

}

/*=========================================================
                Database Transaction
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

    findByFilename,

    findAll,

    count,

    update,

    rename,

    remove,

    search,

    recent,

    findByUser,

    findByHash,

    storageUsage,

    typeStatistics,

    uploadStatistics,

    removeAll,

    bulkInsert,

    runTransaction

};