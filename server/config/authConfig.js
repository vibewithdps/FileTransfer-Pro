// =====================================
// AUTHENTICATION CONFIGURATION
// =====================================


// JWT SETTINGS

const jwtConfig = {


    accessTokenSecret:
        process.env.JWT_SECRET,


    refreshTokenSecret:
        process.env.JWT_REFRESH_SECRET,


    accessTokenExpiry:
        process.env.JWT_ACCESS_EXPIRE || "15m",


    refreshTokenExpiry:
        process.env.JWT_REFRESH_EXPIRE || "7d"



};







// =====================================
// PASSWORD CONFIGURATION
// =====================================

const passwordConfig = {


    saltRounds:

        Number(
            process.env.BCRYPT_ROUNDS
        )
        || 12



};







// =====================================
// COOKIE CONFIGURATION
// =====================================

const cookieConfig = {


    refreshToken:{


        httpOnly:true,


        secure:
        process.env.NODE_ENV === "production",


        sameSite:"strict",


        maxAge:
        7 *
        24 *
        60 *
        60 *
        1000



    }



};







// =====================================
// SECURITY SETTINGS
// =====================================

const securityConfig = {


    maxLoginAttempts:

        5,


    lockTime:

        15 *
        60 *
        1000



};







module.exports = {


    jwtConfig,


    passwordConfig,


    cookieConfig,


    securityConfig


};