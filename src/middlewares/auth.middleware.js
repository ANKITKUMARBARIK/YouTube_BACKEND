import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
    // frontend pe check kro cookie or header mein token hai ya nhi
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Unauthorized request");

    // Server verifies JWT using secret key to ensure token integrity and expiry — token comes from cookie or Authorization header
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedToken) throw new ApiError(401, "Unauthorized request");

    // Agar user database mein exist nahi karta, token to valid ho sakta hai but user delete ho gaya — so again 401 Unauthorized.
    const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Invalid Access Token");

    req.user = user;
    next();
});

export default verifyJWT;
