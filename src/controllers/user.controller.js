import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        // generate access and refresh token
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        // save refresh token in db
        user.refreshToken = refreshToken;
        // ⛔️ Skip full schema validation while saving — only save the updated field safely
        await user.save({ validateBeforeSave: false });

        // now return access and refresh tokens
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};

export const registerUser = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get user details from frontend
        - validation - not empty
        - check if user already exists: username, email
        - check for images, get user avatar,coverImage from frontend
        - check for images, upload them to cloudinary, (avatar,coverImage)
        - create user object - create entry in db
        - remove password and refresh token field from response
        - check for user creation
        - return res
    */

    // get user details from frontend
    const { username, email, fullName, password } = req.body;
    // validation - not empty
    if ([username, email, fullName, password].some((field) => !field?.trim()))
        throw new ApiError(400, "All fields are required");

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (existedUser)
        throw new ApiError(409, "Email or Username Already Exists");

    // check for images, get user avatar,coverImage from frontend
    console.log(req.files);
    let avatarLocalPath, coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        avatarLocalPath = req.files.avatar[0].path;
    }
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required");

    // check for images, upload them to cloudinary, (avatar,coverImage)
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar?.url) throw new ApiError(400, "Avatar file is required");

    // create user object - create entry in db
    const user = new User({
        username: username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });
    await user.save();

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // check for user creation
    if (!createdUser)
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );

    // return res
    return res
        .status(201)
        .json(
            new ApiResponse(201, createdUser, "User registered Successfully")
        );
});

export const loginUser = asyncHandler(async (req, res) => {
    /* 
    TODO:-
        - get user details from frontend
        - validation - not empty
        - check if user doesn't exists: username, email
        - password check
        - generate access and refresh token
        - save refresh token in db
        - get user data without sensitive infos.
        - cookie options - secure true only in production
        - set cookies & send response
    */

    // get user details from frontend
    const { username, email, password } = req.body;
    // validation - not empty
    if ([username, email, password].some((field) => !field?.trim()))
        throw new ApiError(400, "Username or Email is required");

    // check if user doesn't exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (!existedUser) throw new ApiError(404, "User does not exist");

    // password check
    const isPasswordValid = await existedUser.comparePassword(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

    // generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        existedUser._id
    );

    // get user data without sensitive infos.
    const user = await User.findById(existedUser._id).select(
        "-password -refreshToken"
    );

    // cookie options - secure true only in production
    const options = {
        httpOnly: true, // ✅ Cookie JS se access nahi kar sakta (XSS protection)
        secure: true, // ✅ Only HTTPS pe hi send hogi
    };

    // set cookies & send response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: user, accessToken, refreshToken },
                "User Logged In successfully"
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    /* 
    TODO:-
        - delete refreshToken from db
        - clear cookie and send response
    */

    // delete refreshToken from db
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1, // delete this field
            },
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    // clear cookie and send response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get refreshToken from cookies - frontend
        - Server verifies JWT using secret key to ensure token integrity and expiry — refreshToken comes from cookie
        - check refreshToken, user _id exist in db or not
        - now check db refreshToken and cookie refreshToken
        - now generate new access and refresh tokens
        - set cookies & send response
    */

    // get refreshToken from cookies
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

    // Server verifies JWT using secret key to ensure token integrity and expiry — refreshToken comes from cookie
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) throw new ApiError(401, "Unauthorized request");

    // check refreshToken, user _id exist in db or not
    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "Invalid refresh token");

    // now check db refreshToken and cookie refreshToken
    if (incomingRefreshToken !== user?.refreshToken)
        throw new ApiError(401, "Refresh token is expired or used");

    // now generate new access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    // set cookies & send response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { tokens: accessToken, refreshToken },
                "Access token refreshed successfully"
            )
        );
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get and check old, new, confirm password from frontend
        - check user in db
        - check/compare old password and db password
        - update and save db password into confirm password
        - return res
    */

    // get and check old, new, confirm password from frontend
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (
        [oldPassword, newPassword, confirmPassword].some(
            (field) => !field?.trim()
        )
    )
        throw new ApiError(400, "");

    if (oldPassword === newPassword)
        throw new ApiError(
            1,
            "Old password and New Password must be different"
        );

    if (newPassword !== confirmPassword)
        throw new ApiError(
            401,
            "New password and Confirm Password must be equal"
        );

    // check user in db
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(400, "User not found");

    // check/compare old password and db password
    const comparePassword = await user.comparePassword(oldPassword);
    if (!comparePassword) throw new ApiError(401, "Invalid Old Password");

    // update and save db password into confirm password
    user.password = confirmPassword;
    await user.save({ validateBeforeSave: false });

    // return res
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        );
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
    /* 
    NOTE:-
        Production level par file updates (jaise image) ke liye alag controller aur endpoint banao. Sirf required data update karo, pura user object wapas bhejna avoid karo.
    */

    /*
    TODO:-
        - get body(text based data) details like- username,email,fullName
        - check user in db and update
        - return res
    */

    // get body(text based data) details like- username,email,fullName
    const { username, email, fullName } = req.body;

    // check user in db and update
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { username, email, fullName } },
        { new: true }
    ).select("-password -refreshToken");
    if (!user) throw new ApiError(401, "Invalid Old Password");

    // return res
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get and check body(file based data) details like- avatar or coverImage
        - now upload on cloudinary
        - check user in db and update
        - return res
    */

    // get and check body(file based data) details like- avatar or coverImage
    let avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // now upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url)
        throw new ApiError(401, "Error while uploading on avatar");

    // check user in db and update
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password -refreshToken");

    // return res
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
    /*
    TODO:-
        - get and check body(file based data) details like- avatar or coverImage
        - now upload on cloudinary
        - check user in db and update
        - return res
    */

    // get and check body(file based data) details like- avatar or coverImage
    let coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "CoverImage file is missing");
    }

    // now upload on cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url)
        throw new ApiError(401, "Error while uploading on coverImage");

    // check user in db and update
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password -refreshToken");

    // return res
    return res
        .status(200)
        .json(new ApiResponse(200, user, "CoverImage updated successfully"));
});
