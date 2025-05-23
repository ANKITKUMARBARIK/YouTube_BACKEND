import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser); // secured routes

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
    .route("/avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
    .route("/coverImage")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getWatchHistory);

export default router;

// req.files  -------Output :->
// {
//   avatar: [
//     {
//       fieldname: 'avatar',
//       originalname: 'avatar.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       destination: 'uploads/',
//       filename: 'a1b2c3d4.jpg',
//       path: 'uploads/a1b2c3d4.jpg',
//       size: 12345
//     }
//   ],
//   coverImage: [
//     {
//       fieldname: 'coverImage',
//       originalname: 'cover.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       destination: 'uploads/',
//       filename: 'z9x8y7.jpg',
//       path: 'uploads/z9x8y7.jpg',
//       size: 23456
//     }
//   ]
// }
