
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PageLayout } from './components/layout/PageLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { SearchPage } from './pages/SearchPage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { ComboSelectionPage } from './pages/ComboSelectionPage';
import { PaymentPage } from './pages/PaymentPage';
import { BookingSuccessPage } from './pages/BookingSuccessPage';
import { BookingFailedPage } from './pages/BookingFailedPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { AdminRoute } from './components/layout/AdminRoute';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminMoviesPage } from './pages/admin/AdminMoviesPage';
import { AdminShowtimesPage } from './pages/admin/AdminShowtimesPage';
import { AdminCinemasPage } from './pages/admin/AdminCinemasPage';
import { AdminRoomsPage } from './pages/admin/AdminRoomsPage';
import { AdminSeatsPage } from './pages/admin/AdminSeatsPage';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage';
import { AdminAccountsPage } from './pages/admin/AdminAccountsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PageLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'movies', element: <MoviesPage /> },
      { path: 'movies/:id', element: <MovieDetailPage /> },
      { path: 'search', element: <SearchPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'booking/seat-selection/:showtimeId', element: <SeatSelectionPage /> },
          { path: 'booking/combo-selection/:showtimeId', element: <ComboSelectionPage /> },
          { path: 'booking/:showtimeId/payment', element: <PaymentPage /> },
          { path: 'booking/success', element: <BookingSuccessPage /> },
          { path: 'booking/failed', element: <BookingFailedPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'movies', element: <AdminMoviesPage /> },
      { path: 'showtimes', element: <AdminShowtimesPage /> },
      { path: 'cinemas', element: <AdminCinemasPage /> },
      { path: 'rooms', element: <AdminRoomsPage /> },
      { path: 'seats', element: <AdminSeatsPage /> },
      { path: 'promotions', element: <AdminPromotionsPage /> },
      { path: 'accounts', element: <AdminAccountsPage /> },
      { path: 'analytics', element: <AdminAnalyticsPage /> },
    ],
  },
  { path: 'login', element: <LoginPage /> },
  { path: 'register', element: <RegisterPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
