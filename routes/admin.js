const express = require("express");
const router = express.Router();
const User = require("../models/user");
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
const category = require("../models/category");
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
});

//ADMIN DASHBOARD
router.get('/:user_id', (req, res) => {
    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            req.flash("error", "User can't be accessed");
            res.redirect('/')
            console.log(err);
        }
        res.render('admin/dashboard', { user: foundUser });
    })
})

//INDEX - show all posts
router.get("/:user_id/posts", (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
            req.flash('error', 'User can not be found!')
        }
        // Get all post from DB
        Post.find().where('author.id').equals(foundUser._id).exec((err, posts) => {
            if (err) {
                req.flash("error", "User can't be accessed");
                res.redirect('/')
                console.log(err);
            } else {
                res.render('admin/post_index', { user: foundUser, posts: posts });
            }
        })
    });
});

//CREATE NEW POST
router.get('/:user_id/posts/new', (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        Category.find().then(cats => {
            res.render('admin/post_create', { user: foundUser, cats: cats });
        });
    });

})


//CREATE - add new post to DB

router.post("/:user_id/posts", middleware.isLoggedIn, upload.single('image'), (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
        }
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
                    req.flash("error", "Post could not be created");
                    console.log(err);
                } else {
                    //redirect back to campgrounds page
                    console.log(newlyCreated);
                    req.flash("success", "Post was created");
                    res.redirect("/posts");
                }
                66666
            });
        });

    });
});



//EDIT - edit selected post
router.get('/:user_id/posts/edit/:post_id', (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        Post.findById(req.params.post_id, (err, foundPost) => {
            if (err) {
                console.log(err)
            }
            Category.find({}, (err, cats) => {
                res.render('admin/post_edit', { post: foundPost, cats: cats, user: foundUser });
            })
        })
    })
})

//UPDATE - update selected post

router.put('/:user_id/posts/:post_id', (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
        }

        Post.findByIdAndUpdate(req.params.post_id, {...req.body.post }, async(err, updatedPost) => {
            if (err && !updatedPost) {
                req.flash('error', 'Post failed to be updated')
                res.redirect(`/admin/${foundUser._id}/posts`)
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
            }

        })
    })

})

//DELETE - delete selected post
router.delete('/:user_id/posts/:post_id', (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
        }
        Post.findByIdAndRemove(req.params.post_id, async(err, foundPost) => {
            if (err) {
                req.flash('error', 'Post failed to be deleted')
                res.redirect(`/admin/${foundUser._id}/posts`)
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
});


//INDEX - show all categories
router.get("/:user_id/categories", (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
        }
        // Get all post from DB
        Category.find().then(categories => {
            res.render('admin/category_index', { categories: categories, user: foundUser });
        });
    });
});

router.post("/:user_id/categories", (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
        }
        const categoryName = req.body.title;

        if (categoryName) {
            const newCategory = new Category({
                title: categoryName
            });

            newCategory.save().then(category => {
                console.log(category);
                res.redirect(`/admin/${foundUser._id}/categories`)
            });
            console.log('new created category data:' + newCategory)
        };
    });
});
router.get("/:user_id/categories/edit/:category_id", (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
        }
        const catId = req.params.category_id;
        Category.findById(catId, (err, category) => {
            if (err) {
                console.log(err)
            } else {
                res.render('admin/category_edit', { category: category, user: foundUser })
            }
        })
    })
});

router.put("/:user_id/categories/:category_id", (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
        }
        const catId = req.params.category_id

        Category.findByIdAndUpdate(catId, req.body.category, (err, updatedCat) => {
            if (err && !updatedCat) {
                res.redirect(`/admin/${foundUser._id}/categories`)
            } else {
                console.log(updatedCat);
                res.redirect(`/admin/${foundUser._id}/categories`)
            }
        })
    })
});
//DELETE - delete selected category
router.delete('/:user_id/categories/:category_id', (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
        }
        Category.findByIdAndRemove(req.params.category_id, (err, deletedCategory) => {
            if (err) {
                console.log(err)
                res.redirect(`/admin/${foundUser._id}/categories`)
            } else {
                console.log('Deleted category data:' + deletedCategory)
                res.redirect(`/admin/${foundUser._id}/categories`)
            }
        })
    })
});

//CREATE POST - add post on selected category
router.get('/:user_id/categories/:category_id/posts/new', (req, res) => {

    User.findById(req.params.user_id, (err, foundUser) => {
        if (err) {
            console.log(err)
        }
        Category.findById(req.params.category_id, (err, category) => {
            if (err) {
                console.log(err)
            }
            res.render('admin/cat_post_create', { user: foundUser, category: category });
        });
    });
});

//CREATE - add new post to DB

router.post("/:user_id/categories/:category_id/posts", middleware.isLoggedIn, upload.single('image'), async(req, res) => {

    User.findById(req.params.user_id, (err) => {
        if (err) {
            console.log(err)
        }
        const catId = req.params.category_id;
        Category.findById(catId, (err, category) => {
            if (err) {
                console.log(err)
            } else {
                // get data from form and add to posts array
                console.log(req.file)

                // add author to post
                req.body.post.author = {
                    id: req.user._id,
                    username: req.user.username
                }
                Post.create(req.body.post, async(err, newlyCreated) => {
                    if (err) {
                        req.flash("error", "Post could not be created");
                        console.log(err);
                    } else {
                        //redirect back to posts page
                        category.posts.push(newlyCreated);
                        newlyCreated.category = category;
                        await category.save();
                        await newlyCreated.save();

                        req.flash("success", "Post was created");
                        res.redirect("/posts");
                        console.log(`Post ${newlyCreated} inside ${category}`);
                    }
                });

            }
        })
    })
})

router.get("/comments", (req, res) => {
    Comment.find()
        .populate('user')
        .then(comments => {
            res.render('comments/index', { comments: comments });
        })
})


module.exports = router;