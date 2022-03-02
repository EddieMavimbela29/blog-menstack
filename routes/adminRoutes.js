const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const Comment = require("../models/comment");
const Category = require("../models/category");
const middleware = require("../middleware");

const multer = require('multer');
const storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
const imageFilter = function(req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter })

const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

//ADMIN DASHBOARD
router.get('/', (req, res) => {
        res.render('dashboard');
    })
    //INDEX - show all posts
router.get("/posts", function(req, res) {
    // Get all post from DB
    Post.find()
        .populate('category')
        .then(posts => {
            res.render('posts/index', { posts: posts });
        });
});

//CREATE NEW POST
router.get('/posts/new', (req, res) => {
        Category.find().then(cats => {

            res.render('posts/create', { cats: cats });
        });


    })
    //CREATE - add new post to DB

router.post("/posts", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    // get data from form and add to campgrounds array
    console.log(req.file)
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.post.image = result.secure_url;
        // add image's public_id to campground object
        req.body.post.imageId = result.public_id;
        // add author to campground
        req.body.post.author = {
                id: req.user._id,
                username: req.user.username
            }
            // Create a new campground and save to DB
        Post.create(req.body.post, function(err, newlyCreated) {
            if (err) {
                req.flash("error", "Campground could not be created");
                console.log(err);
            } else {
                //redirect back to campgrounds page
                console.log(newlyCreated);
                req.flash("success", "Campground was created");
                res.redirect("/posts");
            }
        });
    });
});



//EDIT - edit selected post
router.get('/posts/edit/:id/', function(req, res) {
    Post.findById(req.params.id, function(err, foundPost) {
        Category.find({}, function(err, cats) {
            res.render('posts/edit', { post: foundPost, cats: cats });
        })

    })
})

//UPDATE - update selected post

router.put('/posts/:id', function(req, res) {

    const newPostData = { title: req.body.title, image: req.body.image, description: req.body.description };

    Post.findByIdAndUpdate(req.params.id, { $set: newPostData, new: true }, async(err, updatedPost) => {
        if (err && !updatedPost) {
            req.flash('error', 'Post failed to be updated')
            res.redirect('/admin/posts')
        } else {
            if (req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(updatedPost.imageId);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    updatedPost.imageId = result.public_id;
                    updatedPost.image = result.secure_url;
                } catch (err) {
                    req.flash("error", 'Post failed to be updated');
                    return res.redirect("back");
                }
            }
            updatedPost.title = req.body.title;
            updatedPost.description = req.body.description;
            updatedPost.save();
            req.flash("success", "Successfully Updated!");
            res.redirect("/posts/" + updatedPost._id);
            console.log('updated post' + updatedPost)
        }

    })

})

//DELETE - delete selected post
router.delete('/posts/:id', function(req, res) {
    Post.findByIdAndRemove(req.params.id, async function(err, foundPost) {
        if (err) {

            res.redirect('/admin/posts')
        } else {

            try {
                await cloudinary.v2.uploader.destroy(foundPost.imageId);
                foundPost.remove();
                req.flash('success', 'Post deleted successfully!');
                res.redirect('/posts');
            } catch (err) {
                if (err) {
                    req.flash("error", 'Post failed to be deleted');
                    return res.redirect("back");
                }
            }

        }
    });
});

//Blog Categories

//INDEX - show all categories
router.get("/categories", function(req, res) {
    // Get all post from DB
    Category.find().then(categories => {
        res.render('category/index', { categories: categories });
    });
});

router.post("/categories", function(req, res) {

    const categoryName = req.body.title;

    if (categoryName) {
        const newCategory = new Category({
            title: categoryName
        });

        newCategory.save().then(category => {
            console.log(category);
            res.redirect('/admin/categories')
        });
        console.log(newCategory)
    };
});

router.get("/categories/edit/:id", (req, res) => {

    const catId = req.params.id;
    Category.findById(catId, (err, category) => {
        if (err) {
            console.log(err)
        } else {
            res.render('category/edit', { category: category })
        }
    })
});

router.put("/categories/:id", (req, res) => {

    const catId = req.params.id;

    Category.findByIdAndUpdate(catId, req.body.category, (err, updatedCat) => {
        if (err && !updatedCat) {
            res.redirect('/admin/categories')
        } else {
            console.log(updatedCat);
            res.redirect('/admin/categories')
        }
    })
});
//DELETE - delete selected category
router.delete('/categories/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id, (err, deletedCategory) => {
        if (err) {
            console.log(err)
            res.redirect('/admin/categories');
        } else {
            console.log(deletedCategory)
            res.redirect('/admin/categories');
        }
    })
});

router.get("/comments", function(req, res) {
    Comment.find()
        .populate('user')
        .then(comments => {
            res.render('comments/index', { comments: comments });
        })
})


module.exports = router;