import { FullPageLoader } from '@/components/ui/loaders';
import { Suspense } from 'react';
import { Routes } from 'react-router';
import { publicRoutes } from './(public)/routes';

export default function AppRouter() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>{publicRoutes}</Routes>
    </Suspense>
  );
}
