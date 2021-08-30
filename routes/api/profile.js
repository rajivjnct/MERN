const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const { route } = require('./users');

// @route   GET api/profile/me
// @desc    Get current user Profile
// @access  Private

router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'There is no Profile for this User' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route   POST api/profile/
// @desc    Create or Update User Profile.
// @access  Private

router.post('/', [
    auth,
    [
        check('status', 'Status is Required').not().isEmpty(),
        check('skills', 'Skills is Required').not().isEmpty(),
    ]
],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            linkdln,
            instagram } = req.body;

        //Build Profile Object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        // Build Social Object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkdln) profileFields.social.linkdln = linkdln;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                //Update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                )
                return res.json(profile);
            }

            // Create
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }


    }
)

// @route   GET api/profile/
// @desc    Get all Profiles
// @access  Private

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route   GET api/profile/user/:user_id
// @desc    Get Specific Profiles
// @access  Public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }
})


// @route   DELETE api/profile
// @desc    Delete Profile User and Post
// @access  Private

router.delete('/', auth, async (req, res) => {
    try {
        //To do Remove Users Posts

        //Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });

        //Remove User
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User Deleted' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/experience
// @desc    Add or Update Experience
// @access  Private

router.put(
    '/experience',
    [
        auth,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is Required').not().isEmpty()
        ]
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.push(newExp);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    })

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete Experience
// @access  Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get Remove Index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');

    }
});

// @route   PUT api/profile/education
// @desc    Add or Update Education
// @access  Private

router.put(
    '/education',
    [
        auth,
        [
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'Degree is Required').not().isEmpty(),
            check('fieldOfStudy', 'Field of Study is Required').not().isEmpty()
        ]
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            school,
            degree,
            fieldOfStudy,
            from,
            to,
            current,
            description
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldOfStudy,
            from,
            to,
            current,
            description
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.push(newEdu);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete Education from Profile
// @access  Private

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get Remove Index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');

    }
});

// @route   GET api/profile/github/:username
// @desc    Get User Repo from Git Hub
// @access  Public

router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githunClientId')}&client_secret=${config.get('githubSecret')}`,
            method: "GET",
            headers: { 'user-agent': 'node.js' }
        }

        request(options, (error, response, body) => {
            if (error) console.error(error);

            console.log("Response = " + response.statusCode);

            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No Github Profile Found' });
            }

            res.json(JSON.parse(body));
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;