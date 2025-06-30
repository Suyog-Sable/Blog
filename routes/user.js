const { Router } = require("express");
const User = require('../models/user')

//for profile dashboard
const Blog = require('../models/blog');
const Like = require('../models/likes');


const router = Router();

router.get("/signin", (req, res) => {
    return res.render("signin");
});

router.get("/signup", (req, res) => {
    return res.render("signup");
});

router.get('/profile', async (req, res) => {
    if (!req.user) return res.redirect('/user/signin');

    const blogs = await Blog.find({ createdBy: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

    for (let blog of blogs) {
        blog.likeCount = await Like.countDocuments({ blogId: blog._id });
    }

    res.render('profile', {
        user: req.user,
        blogs
    });
});
router.get('/about', (req, res) => {
    res.render('about', {
        user: req.user
    });
});


router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await User.matchPasswordAndGenerateToken(email, password);

        return res.cookie("token", token).redirect("/");
    } catch (error) {
        return res.render("signin", {
            error: "Incorrect email or Password",
        });
    }
})

router.get("/logout", (req, res) => {
    res.clearCookie("token").redirect("/");
});

router.post("/signup", async (req, res) => {
    const { fullName, email, password } = req.body;
    await User.create({
        fullName,
        email,
        password,
    });
    return res.redirect("/");
});
module.exports = router;