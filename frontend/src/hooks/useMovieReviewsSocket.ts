import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;

export function useMovieReviewsSocket(
  movieId: string, 
  onNewReview: (review: any) => void, 
  onNewReply: (reply: any) => void,
  onReviewDeleted?: (data: { reviewId: string; cascaded: boolean; threadRootId: string | null }) => void
) {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!movieId) return;

    if (!socket) {
      const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:3000';
      socket = io(backendUrl, {
        auth: { token: accessToken },
      });
    }

    socket.emit('join_movie_room', movieId);

    socket.on('new_review', onNewReview);
    socket.on('new_reply', onNewReply);
    if (onReviewDeleted) {
      socket.on('review_deleted', onReviewDeleted);
    }

    return () => {
      socket?.emit('leave_movie_room', movieId);
      socket?.off('new_review', onNewReview);
      socket?.off('new_reply', onNewReply);
      if (onReviewDeleted) socket?.off('review_deleted', onReviewDeleted);
    };
  }, [movieId, accessToken, onNewReview, onNewReply, onReviewDeleted]);
}
