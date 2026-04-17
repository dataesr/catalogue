import { Toaster } from '@/components/ui/Toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { queryClient } from '@/api/query-client';
import AppRouter from '@/routes';

import '@/components/ui/styles';
import './styles/index.css';

const elem = document.getElementById('root');
if (!elem) throw new Error('Root element not found');

const app = (
  <StrictMode>
    <BrowserRouter>
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <AppRouter />
          <Toaster />
        </QueryClientProvider>
      </NuqsAdapter>
    </BrowserRouter>
  </StrictMode>
);

if (import.meta.hot) {
  if (!import.meta.hot.data.root) {
    import.meta.hot.data.root = createRoot(elem);
  }
  import.meta.hot.data.root.render(app);
} else {
  createRoot(elem).render(app);
}
