const Post = require('../models/post');
const Comment = require('../models/comment');


const middlewareObj = {};
//MIDDLEWARE - checks whether user own a post or not

 middlewareObj.checkPostOwnership = function(req, res, next){
    if (req.isAuthenticated) {
        Post.findById(req.params.id, function(err, foundPost){
            if (err && !foundPost) {
                req.flash("error", "Post not found");
                res.redirect("back")
            } else {
                //does user own post
                if (foundPost.author.id.equals(req.user._id) || req.user.isAdmin) {
                      next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back")
                }
            }
        })
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back")
    }
}


 middlewareObj.checkCommentOwnership = function(req, res, next){
    if (req.isAuthenticated) {
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if (err && !foundComment) {
                req.flash("error", "comment not find")
                res.redirect("back")
            } else {
                //does user own campground
                if (foundComment.author.id.equals(req.user._id) ) {
                      next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back")
                }
            }
        })
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back")
    }
}

 middlewareObj.isLoggedIn = function(req,res, next){
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect('back')
    }
}

module.exports = middlewareObj;