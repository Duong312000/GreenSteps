const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const { softAuth } = require('../middlewares/auth.middleware');

router.get('/posts', communityController.getPosts);
router.post('/posts', softAuth, communityController.addPost);
router.post('/posts/:id/like', softAuth, communityController.likePost);
router.post('/posts/:id/comments', softAuth, communityController.addPostComment);
router.get('/posts/:id/comments', communityController.getPostComments);

module.exports = router;
