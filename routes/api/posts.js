const express = require('express');
const auth = require('../../middleware/auth');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const Post = require('../../models/Posts');
const Profile = require('../../models/Profile');
const User = require('../../models/Users');

// @route   POST api/posts
// @desc    Create a Post
// @access  Public

router.post(
    '/',
    [
        auth,
        [
            check('text', 'Text is Required').not().isEmpty(),
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            })
            const post = await newPost.save();
            res.json(post);
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server Error');
        }


    })

// @route   GET api/posts
// @desc    Get all Post
// @access  Public

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.errors(err.message);
        res.status(500).send('Server Error');
    }
})

// @route   GET api/posts
// @desc    Get Post by ID
// @access  Public

router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'No Post found' });
        }
        res.json(post);

    } catch (err) {
        console.error(err.message);
        if (err.kind === ObjectId) {
            return res.status(404).json({ msg: 'No Post found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/posts
// @desc    DELETE Post by ID
// @access  Public

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //Check Post
        if (!post) {
            return res.status(404).json({ msg: 'Post not Found' })
        }
        //Check User
        if (post.user.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'User is not authorized' });
        }
        await post.remove();
        res.json({ msg: 'Post Removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not Found' })
        }
        res.status(404).send('Server Error');
    }
})

// @route   PUT api/posts/like/:id
// @desc    Like a Post
// @access  Private

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        //Check the Post has already been like
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post is already liked' });
        }

        post.likes.push({ user: req.user.id });
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;