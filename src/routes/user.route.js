import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";

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
