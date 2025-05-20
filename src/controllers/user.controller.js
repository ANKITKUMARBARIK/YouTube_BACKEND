import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
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

// get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, get user avatar,coverImage from frontend
// check for images, upload them to cloudinary, (avatar,coverImage)
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res
