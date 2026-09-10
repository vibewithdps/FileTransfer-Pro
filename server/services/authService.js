const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const User = require("../models/User");


// ===============================
// JWT CONFIGURATION
// ===============================

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";



// ===============================
// CREATE ACCESS TOKEN
// ===============================

const generateAccessToken = (user) => {

    return jwt.sign(

        {
            id:user._id,
            email:user.email,
            role:user.role
        },

        process.env.JWT_SECRET,

        {
            expiresIn:ACCESS_TOKEN_EXPIRY
        }

    );

};




// ===============================
// CREATE REFRESH TOKEN
// ===============================

const generateRefreshToken = (user)=>{

    return jwt.sign(

        {
            id:user._id,
            tokenId:uuidv4()
        },

        process.env.JWT_REFRESH_SECRET,

        {
            expiresIn:REFRESH_TOKEN_EXPIRY
        }

    );

};




// ===============================
// HASH PASSWORD
// ===============================

const hashPassword = async(password)=>{

    const salt =
        await bcrypt.genSalt(12);


    return await bcrypt.hash(

        password,

        salt

    );

};




// ===============================
// VERIFY PASSWORD
// ===============================

const verifyPassword = async(
    password,
    hashedPassword
)=>{

    return await bcrypt.compare(

        password,

        hashedPassword

    );

};




// ===============================
// USER REGISTRATION
// ===============================

const registerUser = async(data)=>{


    const {

        name,

        email,

        password,

        role="user"

    } = data;



    const existingUser =
        await User.findOne({

            email

        });



    if(existingUser){

        throw new Error(
            "User already exists"
        );

    }



    const hashedPassword =
        await hashPassword(
            password
        );



    const user =
        await User.create({

            name,

            email,

            password:hashedPassword,

            role

        });



    return {

        id:user._id,

        name:user.name,

        email:user.email,

        role:user.role

    };


};




// ===============================
// LOGIN USER
// ===============================

const loginUser = async(
    email,
    password
)=>{


    const user =
        await User.findOne({

            email

        });



    if(!user){

        throw new Error(
            "Invalid credentials"
        );

    }



    const passwordMatch =
        await verifyPassword(

            password,

            user.password

        );



    if(!passwordMatch){

        throw new Error(
            "Invalid credentials"
        );

    }



    const accessToken =
        generateAccessToken(
            user
        );



    const refreshToken =
        generateRefreshToken(
            user
        );



    user.refreshToken =
        refreshToken;


    user.lastLogin =
        new Date();



    await user.save();



    return {


        user:{


            id:user._id,

            name:user.name,

            email:user.email,

            role:user.role


        },


        accessToken,

        refreshToken


    };


};





// ===============================
// REFRESH ACCESS TOKEN
// ===============================

const refreshAccessToken =
async(refreshToken)=>{


    if(!refreshToken){

        throw new Error(
            "Refresh token missing"
        );

    }



    const decoded =
        jwt.verify(

            refreshToken,

            process.env.JWT_REFRESH_SECRET

        );



    const user =
        await User.findById(

            decoded.id

        );



    if(!user){

        throw new Error(
            "User not found"
        );

    }



    if(
        user.refreshToken !== refreshToken
    ){

        throw new Error(
            "Invalid refresh token"
        );

    }



    const newAccessToken =
        generateAccessToken(
            user
        );



    return {

        accessToken:newAccessToken

    };


};





// ===============================
// LOGOUT USER
// ===============================

const logoutUser =
async(userId)=>{


    await User.findByIdAndUpdate(

        userId,

        {

            refreshToken:null

        }

    );


    return true;

};





// ===============================
// UPDATE PROFILE
// ===============================

const updateProfile =
async(
    userId,
    data
)=>{


    const user =
        await User.findByIdAndUpdate(

            userId,

            {

                name:data.name

            },

            {

                new:true

            }

        )
        .select(
            "-password -refreshToken"
        );



    if(!user){

        throw new Error(
            "User not found"
        );

    }



    return user;


};





// ===============================
// CHANGE PASSWORD
// ===============================

const changePassword =
async(
    userId,
    oldPassword,
    newPassword
)=>{


    const user =
        await User.findById(

            userId

        );



    if(!user){

        throw new Error(
            "User not found"
        );

    }



    const match =
        await verifyPassword(

            oldPassword,

            user.password

        );



    if(!match){

        throw new Error(
            "Old password incorrect"
        );

    }



    user.password =
        await hashPassword(

            newPassword

        );



    // logout other sessions

    user.refreshToken =
        null;



    await user.save();



    return true;


};





// ===============================
// ROLE CHECK
// ===============================

const checkRole =
(user,allowedRoles)=>{


    return allowedRoles.includes(

        user.role

    );


};





module.exports = {


    registerUser,

    loginUser,

    logoutUser,

    refreshAccessToken,


    updateProfile,

    changePassword,


    generateAccessToken,

    generateRefreshToken,


    verifyPassword,

    checkRole


};