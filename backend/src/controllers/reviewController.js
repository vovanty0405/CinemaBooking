const Review = require('../models/Review')
const Movie = require('../models/Movies')
const mongoose = require('mongoose')
const { emitToMovie } = require('../sockets/index')

const recalculateMovieRating = async (movieId) => {
  const stats = await Review.aggregate([
    { $match: { movieId: new mongoose.Types.ObjectId(movieId), threadRootId: null, isDeleted: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ])
  await Movie.findByIdAndUpdate(movieId, {
    avgRatingScore: stats[0] ? Number(stats[0].avg.toFixed(1)) : 0,
    totalReviews: stats[0]?.count || 0
  })
}

exports.createReview = async (req, res, next) => {
  try {
    const { movieId, rating, comment } = req.body
    const userId = req.user.id

    const existing = await Review.findOne({ movieId, userId, threadRootId: null, isDeleted: false })
    if (existing) {
      return res.status(400).json({ message: 'Bạn đã đánh giá phim này rồi.' })
    }

    const review = await Review.create({ movieId, userId, rating, comment })
    await recalculateMovieRating(movieId)

    const populated = await review.populate('userId', 'name avatarUrl role')
    
    emitToMovie(movieId, 'new_review', populated)

    res.status(201).json({ message: 'Đánh giá thành công', data: populated })
  } catch (error) {
    next(error)
  }
}

exports.replyReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params
    const { comment } = req.body
    const userId = req.user.id

    const targetReview = await Review.findById(reviewId)
    if (!targetReview || targetReview.isDeleted) {
      return res.status(404).json({ message: 'Đánh giá không tồn tại hoặc đã bị xóa.' })
    }

    const threadRootId = targetReview.threadRootId || targetReview._id

    const reply = await Review.create({
      movieId: targetReview.movieId,
      userId,
      comment,
      threadRootId,
      replyToReviewId: targetReview._id,
      rating: null
    })

    const populated = await reply.populate([
      { path: 'userId', select: 'name avatarUrl role' },
      { path: 'replyToReviewId', select: 'userId', populate: { path: 'userId', select: 'name' } }
    ])
    
    emitToMovie(targetReview.movieId.toString(), 'new_reply', populated)

    res.status(201).json({ message: 'Trả lời thành công', data: populated })
  } catch (error) {
    next(error)
  }
}

exports.getMovieReviews = async (req, res, next) => {
  try {
    const { movieId } = req.params
    const { page = 1, limit = 10, sort = 'newest' } = req.query

    const sortMap = { newest: { createdAt: -1 }, highest: { rating: -1 }, lowest: { rating: 1 } }
    const sortCondition = sortMap[sort] || sortMap.newest

    const topLevelReviews = await Review.find({ movieId, threadRootId: null, isDeleted: false })
      .populate('userId', 'name avatarUrl role')
      .sort(sortCondition)
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const reviewIds = topLevelReviews.map(r => r._id)
    const replies = await Review.find({ threadRootId: { $in: reviewIds }, isDeleted: false })
      .populate([
        { path: 'userId', select: 'name avatarUrl role' },
        { path: 'replyToReviewId', select: 'userId', populate: { path: 'userId', select: 'name' } }
      ])
      .sort({ createdAt: 1 })

    const result = topLevelReviews.map(r => ({
      ...r.toObject(),
      replies: replies.filter(rep => String(rep.threadRootId) === String(r._id))
    }))

    res.json({ data: result })
  } catch (error) {
    next(error)
  }
}

// ADMIN APIs
exports.getAdminReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, movieId, rating, search, type, status, sort = 'newest' } = req.query;
    
    const query = {};
    if (movieId) query.movieId = movieId;
    if (rating) query.rating = Number(rating);
    if (type === 'root') query.threadRootId = null;
    if (type === 'reply') query.threadRootId = { $ne: null };
    if (status === 'hidden') query.isDeleted = true;
    if (status === 'visible') query.isDeleted = false;
    
    // Search by username or comment content
    if (search) {
      // Find users matching search
      const User = require('../models/Users');
      const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const userIds = users.map(u => u._id);
      
      query.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, highest: { rating: -1 }, lowest: { rating: 1 } };
    const sortCondition = sortMap[sort] || sortMap.newest;

    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find(query)
      .populate('userId', 'name avatarUrl role')
      .populate('movieId', 'title posterUrl')
      .sort(sortCondition)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(query);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      data: reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá." });

    const isRootReview = !review.threadRootId;

    if (isRootReview) {
      // Xóa đánh giá gốc → ẩn luôn toàn bộ reply thuộc thread này
      await Review.updateMany(
        { $or: [{ _id: review._id }, { threadRootId: review._id }] },
        { $set: { isDeleted: true } }
      );
      if (review.rating) await recalculateMovieRating(review.movieId);
    } else {
      // Chỉ xóa riêng 1 reply lẻ
      review.isDeleted = true;
      await review.save();
    }

    emitToMovie(review.movieId.toString(), "review_deleted", { reviewId: review._id, cascaded: isRootReview, threadRootId: review.threadRootId });

    res.json({ message: "Đã xóa đánh giá thành công." });
  } catch (error) {
    next(error);
  }
};

exports.getReviewStats = async (req, res, next) => {
  try {
    const totalReviews = await Review.countDocuments({ threadRootId: null });
    const hiddenReviews = await Review.countDocuments({ isDeleted: true });
    const stats = await Review.aggregate([
      { $match: { threadRootId: null, isDeleted: false } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    const avgRating = stats[0] ? Number(stats[0].avg.toFixed(1)) : 0;
    
    res.json({
      data: {
        totalReviews,
        hiddenReviews,
        avgRating
      }
    });
  } catch (error) {
    next(error);
  }
};
