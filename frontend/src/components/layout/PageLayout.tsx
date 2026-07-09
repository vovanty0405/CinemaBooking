import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToastContainer } from '../ui/Toast';

export const PageLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-dark-bg text-text-primary overflow-x-hidden font-sans antialiased">
      <Header />
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
};
