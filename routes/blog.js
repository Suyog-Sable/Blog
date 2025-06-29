const { Router } = require("express");
const router = Router();
const multer = require("multer");
const path = require("path");

const Blog = require('../models/blog');
const Comment = require('../models/comment');
const Like = require('../models/likes');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(`./public/uploads/`))
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null, fileName);
    },
})

const upload = multer({ storage: storage })

router.get("/", async (req, res) => {
    const blogs = await Blog.find()
        //Sort Logic
        .sort({ createdAt: -1 })
        .populate('createdBy')
        .lean();

    for (let blog of blogs) {
        blog.likeCount = await Like.countDocuments({ blogId: blog._id });
    }

    res.render("home", {
        user: req.user,
        blogs,
    });
});


router.get("/add-new", (req, res) => {
    return res.render("addBlog", {
        user: req.user,
    });
});

router.get('/:id', async (req, res) => {
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId).populate('createdBy');
    const comments = await Comment.find({ blogId }).populate("createdBy");

    const likeCount = await Like.countDocuments({ blogId });
    let isLiked = false;
    if (req.user) {
        const liked = await Like.findOne({ blogId, createdBy: req.user._id });
        isLiked = !!liked;
    }
    return res.render("blog", {
        user: req.user,
        blog,
        comments,
        likeCount,
        isLiked: !!isLiked, // true or false
    });
});

router.post("/comment/:blogId", async (req, res) => {
    await Comment.create({
        content: req.body.content,
        blogId: req.params.blogId,
        createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
})

router.post("/like/:blogId", async (req, res) => {
    const { blogId } = req.params;
    const userId = req.user._id;

    const existingLike = await Like.findOne({ blogId, createdBy: userId });
    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
    } else {
        await Like.create({
            blogId,
            createdBy: userId,
        })
    }
    return res.redirect(`/blog/${blogId}`);
})

router.post("/", upload.single("coverImage"), async (req, res) => {
    const { title, body } = req.body;
    const blog = await Blog.create({
        body,
        title,
        createdBy: req.user._id,
        coverImageURL: `/uploads/${req.file.filename}`,
    });
    return res.redirect(`/blog/${blog._id}`);
});

router.post("/delete/:blogId", async (req, res) => {
    const { blogId } = req.params;

    // Find the blog first
    const blog = await Blog.findById(blogId);

    // Check if the logged-in user is the creator
    if (!blog || String(blog.createdBy) !== String(req.user._id)) {
        return res.status(403).send("Unauthorized or blog not found");
    }

    // Delete blog, its comments, and likes
    await Blog.deleteOne({ _id: blogId });
    await Comment.deleteMany({ blogId });
    await Like.deleteMany({ blogId });

    return res.redirect("/");
});


module.exports = router;
