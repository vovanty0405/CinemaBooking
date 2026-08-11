import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { reviewsApi } from '../../api/reviews';
import { bookingsApi } from '../../api/bookings';
import { useAuthStore } from '../../stores/authStore';
import { useMovieReviewsSocket } from '../../hooks/useMovieReviewsSocket';
import { useToastStore } from '../../stores/toastStore';
import { Star, MessageCircle, Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ReviewSectionProps {
  movieId: string;
  avgRatingScore: number;
  totalReviews: number;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ movieId, avgRatingScore = 0, totalReviews = 0 }) => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Lấy danh sách review
  const { data: reviewsRes, isLoading } = useQuery({
    queryKey: ['movieReviews', movieId],
    queryFn: () => reviewsApi.getMovieReviews(movieId),
    enabled: !!movieId
  });

  // Kiểm tra đã mua vé chưa
  const { data: bookingsRes } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsApi.getMyBookings(),
    enabled: !!user
  });

  const myBookings = Array.isArray(bookingsRes?.data?.data) 
    ? bookingsRes?.data?.data 
    : (bookingsRes?.data?.data?.bookings || bookingsRes?.data?.data?.items || []);

  const hasBooked = myBookings.some((b: any) => 
    b.status === 'confirmed' && 
    b.showtime?.movie?._id === movieId
  );

  useEffect(() => {
    if (reviewsRes?.data?.data) {
      setReviews(reviewsRes.data.data);
    }
  }, [reviewsRes]);

  // Hook Socket.io
  useMovieReviewsSocket(
    movieId,
    (newReview) => {
      setReviews((prev) => [{ ...newReview, replies: [] }, ...prev]);
    },
    (newReply) => {
      setReviews((prev) =>
        prev.map((r) => (r._id === newReply.threadRootId ? { ...r, replies: [...(r.replies || []), newReply] } : r))
      );
    },
    (deletedData) => {
      if (deletedData.cascaded) {
        setReviews((prev) => prev.filter((r) => r._id !== deletedData.reviewId));
      } else {
        setReviews((prev) => 
          prev.map((r) => r._id === deletedData.threadRootId 
            ? { ...r, replies: (r.replies || []).filter((rep: any) => rep._id !== deletedData.reviewId) } 
            : r
          )
        );
      }
    }
  );

  // Mutations
  const createReviewMutation = useMutation({
    mutationFn: () => reviewsApi.createReview({ movieId, rating, comment }),
    onSuccess: () => {
      setComment('');
      setRating(0);
      addToast('Gửi đánh giá thành công!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  });

  const replyMutation = useMutation({
    mutationFn: (parentReviewId: string) => reviewsApi.replyReview(parentReviewId, { comment: replyContent }),
    onSuccess: () => {
      setReplyingTo(null);
      setReplyContent('');
      addToast('Đã trả lời bình luận!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return addToast('Vui lòng chọn số sao!', 'warning');
    if (!comment.trim()) return addToast('Vui lòng nhập nội dung!', 'warning');
    createReviewMutation.mutate();
  };

  const handleReply = (parentReviewId: string) => {
    if (!replyContent.trim()) return;
    replyMutation.mutate(parentReviewId);
  };

  // Tính toán phân bổ sao
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (r.rating && r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating as keyof typeof distribution]++;
    }
  });

  return (
    <div className="mt-16 pt-8 border-t border-[#2B2B2B]">
      <h2 className="text-3xl md:text-4xl font-normal text-white mb-8 uppercase font-serif tracking-wider">
        Đánh Giá & Bình Luận
      </h2>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Tổng quan */}
        <div className="w-full md:w-1/3 bg-dark-surface p-6 rounded-xl border border-dark-input flex flex-col items-center justify-center shadow-lg">
          <div className="text-5xl font-bold text-[#F5A623] mb-2">{avgRatingScore.toFixed(1)}</div>
          <div className="flex text-[#F5A623] mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={20} fill={s <= Math.round(avgRatingScore) ? 'currentColor' : 'none'} className={s <= Math.round(avgRatingScore) ? 'text-[#F5A623]' : 'text-gray-600'} />
            ))}
          </div>
          <p className="text-text-muted text-sm">{totalReviews} đánh giá</p>

          <div className="w-full mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = distribution[s as keyof typeof distribution];
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={s} className="flex items-center text-xs text-text-secondary gap-2">
                  <span className="w-3">{s}</span>
                  <Star size={10} className="text-text-muted" />
                  <div className="flex-1 h-1.5 bg-dark-input rounded-full overflow-hidden">
                    <div className="h-full bg-[#F5A623] rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-6 text-right opacity-60">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form nhập đánh giá */}
        <div className="w-full md:w-2/3 bg-dark-surface p-6 rounded-xl border border-dark-input shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Viết đánh giá của bạn</h3>
          
          {!user ? (
            <div className="py-8 text-center bg-dark-bg rounded-lg border border-dark-input text-text-muted">
              Vui lòng đăng nhập để đánh giá phim này.
            </div>
          ) : !hasBooked ? (
            <div className="py-8 text-center bg-dark-bg rounded-lg border border-dashed border-dark-input text-text-muted">
              Mua vé xem phim để có thể đánh giá.
            </div>
          ) : (
            <form onSubmit={handleSubmitReview}>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      fill={(hoverRating || rating) >= star ? '#F5A623' : 'none'}
                      className={(hoverRating || rating) >= star ? 'text-[#F5A623]' : 'text-gray-600'}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm text-text-muted">
                  {rating === 0 ? 'Chọn sao' : `${rating} Sao`}
                </span>
              </div>
              
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                className="w-full px-4 py-3 bg-dark-bg border border-dark-input rounded-lg text-white placeholder-text-muted focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none resize-none mb-4"
                rows={4}
                maxLength={500}
              />
              
              <div className="flex justify-end items-center">
                <span className="text-xs text-text-muted mr-4">{comment.length}/500</span>
                <button
                  type="submit"
                  disabled={createReviewMutation.isPending}
                  className="bg-[#E50914] hover:bg-[#B20710] text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send size={16} /> Gửi đánh giá
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Danh sách bình luận */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white mb-4">Bình luận mới nhất</h3>
        {isLoading ? (
          <div className="text-text-muted">Đang tải...</div>
        ) : reviews.length === 0 ? (
          <div className="text-text-muted italic">Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-dark-surface p-5 rounded-xl border border-dark-input animate-fade-in">
              {/* Review Gốc */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-dark-bg flex items-center justify-center shrink-0 overflow-hidden border border-dark-input">
                  {review.userId?.avatarUrl ? (
                    <img src={review.userId.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-text-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{review.userId?.name || 'Khách'}</span>
                      {(review.userId?.role === 'admin' || review.userId?.role === 'staff') && (
                        <span className="bg-[#E50914] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">Admin</span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} fill={s <= review.rating ? '#F5A623' : 'none'} className={s <= review.rating ? 'text-[#F5A623]' : 'text-gray-600'} />
                    ))}
                  </div>
                  <p className="text-text-secondary text-sm mb-3 leading-relaxed">
                    {review.comment}
                  </p>
                  
                  <button 
                    onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}
                    className="flex items-center gap-1 text-xs text-brand-red font-semibold hover:text-[#FF1E2A] transition-colors"
                  >
                    <MessageCircle size={14} /> Trả lời
                  </button>

                  {/* Reply Input */}
                  {replyingTo === review._id && user && (
                    <div className="mt-3 flex gap-2">
                      <input 
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Viết câu trả lời..."
                        className="flex-1 bg-dark-bg border border-dark-input rounded-lg px-3 py-1.5 text-sm text-white focus:border-brand-red outline-none"
                      />
                      <button 
                        onClick={() => handleReply(review._id)}
                        disabled={replyMutation.isPending || !replyContent.trim()}
                        className="bg-brand-red text-white px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        Gửi
                      </button>
                    </div>
                  )}

                  {/* Replies List */}
                  {review.replies && review.replies.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-[#2B2B2B] space-y-4">
                      {review.replies.map((reply: any) => (
                        <div key={reply._id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center shrink-0 overflow-hidden">
                            {reply.userId?.avatarUrl ? (
                              <img src={reply.userId.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-text-muted" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white text-sm">{reply.userId?.name || 'Khách'}</span>
                                {(reply.userId?.role === 'admin' || reply.userId?.role === 'staff') && (
                                  <span className="bg-[#E50914] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">Admin</span>
                                )}
                              </div>
                              <span className="text-[10px] text-text-muted">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: vi })}
                              </span>
                            </div>
                            
                            {reply.replyToReviewId?._id !== reply.threadRootId && reply.replyToReviewId?.userId?.name && (
                              <p className="text-[11px] text-brand-red mb-1 font-semibold">
                                Trả lời {reply.replyToReviewId.userId.name}
                              </p>
                            )}

                            <p className="text-text-secondary text-sm mb-2">
                              {reply.comment}
                            </p>

                            <button 
                              onClick={() => setReplyingTo(replyingTo === reply._id ? null : reply._id)}
                              className="flex items-center gap-1 text-[11px] text-brand-red font-semibold hover:text-[#FF1E2A] transition-colors"
                            >
                              <MessageCircle size={12} /> Trả lời
                            </button>

                            {/* Reply Input cho Reply con */}
                            {replyingTo === reply._id && user && (
                              <div className="mt-3 flex gap-2">
                                <input 
                                  type="text"
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={`Trả lời ${reply.userId?.name || 'Khách'}...`}
                                  className="flex-1 bg-dark-bg border border-dark-input rounded-lg px-3 py-1.5 text-sm text-white focus:border-brand-red outline-none"
                                />
                                <button 
                                  onClick={() => handleReply(reply._id)}
                                  disabled={replyMutation.isPending || !replyContent.trim()}
                                  className="bg-brand-red text-white px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                                >
                                  Gửi
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
