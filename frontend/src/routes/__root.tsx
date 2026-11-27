import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-32">
      <h1 className="text-4xl font-semibold tracking-tight">That page doesn't exist</h1>
      <p className="mt-4 text-ink-soft">Check the address, or head back to the start.</p>
      <Link to="/" className="mt-6 inline-block font-medium text-ai underline underline-offset-4">
        Back to the home page
      </Link>
    </main>
  );
}
