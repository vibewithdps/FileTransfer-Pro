const express = require("express");

const router = express.Router();


const authController =
    require("../controllers/authController");


const authMiddleware =
    require("../middleware/authMiddleware");




// =====================================
// REGISTER USER
// POST /api/auth/register
// =====================================

router.post(

    "/register",

    authController.register

);





// =====================================
// LOGIN USER
// POST /api/auth/login
// =====================================

router.post(

    "/login",

    authController.login

);





// =====================================
// LOGOUT USER
// POST /api/auth/logout
// =====================================

router.post(

    "/logout",

    authMiddleware.authenticate,

    authController.logout

);






// =====================================
// REFRESH ACCESS TOKEN
// POST /api/auth/refresh
// =====================================

router.post(

    "/refresh",

    authController.refreshToken

);






// =====================================
// GET USER PROFILE
// GET /api/auth/profile
// =====================================

router.get(

    "/profile",

    authMiddleware.authenticate,

    authController.profile

);






// =====================================
// UPDATE PROFILE
// PUT /api/auth/profile
// =====================================

router.put(

    "/profile",

    authMiddleware.authenticate,

    authController.updateProfile

);






// =====================================
// CHANGE PASSWORD
// PUT /api/auth/change-password
// =====================================

router.put(

    "/change-password",

    authMiddleware.authenticate,

    authController.changePassword

);





module.exports = router;