const express = require("express");
const router = express.Router({ mergeParams: true });
const Post = require("../models/post");
const Comment = require("../models/comment");
const middleware = require("../middleware");


//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res) {
    // find post by id
    console.log(req.params.id);
    Post.findById(req.params.id, function(err, post) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", { post: post });
        }
    })
});

//Comments Create
router.post("/", middleware.isLoggedIn, function(req, res) {
    //lookup post using ID
    Post.findById(req.params.id, function(err, post) {
        if (err) {
            console.log(err);
            res.redirect("/posts");
        } else {
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    post.comments.push(comment);
                    post.save();
                    console.log(comment);
                    req.flash('success', 'Created a comment!');
                    res.redirect('/posts/' + post._id);
                }
            });
        }
    });
});

//EDIT - edit comment associated with selected post id
router.get('/:comment_id/edit', middleware.checkCommentOwnership, function(req, res) {
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if (err && !foundComment) {
                req.flash("error", "Comment has not been updated");
                console.log(err)
            } else {
                res.render('comments/edit', { post_id: req.params.id, comment: foundComment })
            }
        })
    })
    //UPDATE - update comment associated with selected post id
router.put('/:comment_id', middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, {...req.body.comment }, function(err, foundPost) {
        if (err && !foundComment) {
            req.flash("error", "Comment has not been updated");
            console.log(err)
        } else {
            req.flash("success", "Comment has been updated");
            res.redirect('/posts/' + req.params.id);
        }
    })
})

//DELETE - delete comment associated with selected campground id
router.delete('/:comment_id', middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function(err, foundPost) {
        if (err) {
            console.log(err)
            req.flash("error", "Comment has not been deleted");
            res.redirect('back')
        } else {
            req.flash("success", "Comment has been deleted");
            res.redirect('/posts');
        }
    })
})

module.exports = router;