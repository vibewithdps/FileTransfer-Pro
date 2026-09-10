const express = require("express");

const router = express.Router();


const adminController =
    require("../controllers/adminController");


const authMiddleware =
    require("../middleware/authMiddleware");



// =====================================
// ADMIN DASHBOARD STATS
// GET /api/admin/stats
// =====================================

router.get(

    "/stats",

    authMiddleware.authenticate,

    authMiddleware.adminOnly,

    adminController.getStats

);





// =====================================
// GET ALL USERS
// GET /api/admin/users
// =====================================

router.get(

    "/users",

    authMiddleware.authenticate,

    authMiddleware.adminOnly,

    adminController.getAllUsers

);





// =====================================
// GET SINGLE USER
// GET /api/admin/users/:id
// =====================================

router.get(

    "/users/:id",

    authMiddleware.authenticate,

    authMiddleware.adminOnly,

    adminController.getUser

);





// =====================================
// UPDATE USER ROLE
// PUT /api/admin/users/:id/role
// =====================================

router.put(

    "/users/:id/role",

    authMiddleware.authenticate,

    authMiddleware.adminOnly,

    adminController.updateUserRole

);





// =====================================
// DELETE USER
// DELETE /api/admin/users/:id
// =====================================

router.delete(

    "/users/:id",

    authMiddleware.authenticate,

    authMiddleware.adminOnly,

    adminController.deleteUser

);





module.exports = router;