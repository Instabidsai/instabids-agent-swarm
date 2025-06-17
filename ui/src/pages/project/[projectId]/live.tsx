// This new page component integrates the LiveVideoChat into the application's routing.
// It will be accessible via a URL like `/project/your-project-id/live`.
// It is responsible for fetching the project details and rendering the live chat component.

import { useRouter } from 'next/router';
import { LiveVideoChat } from '../../../components/LiveVideoChat'; // Adjusted path
import { useAuth } from '../../../hooks/useAuth'; // Assuming a custom auth hook

const LiveWalkthroughPage = () => {
  const router = useRouter();
  const { projectId } = router.query;
  // const { user, isLoading: isAuthLoading } = useAuth(); // Example auth hook
  const user = { id: 'test-user-123' }; // Placeholder for testing
  const isAuthLoading = false; // Placeholder for testing

  if (isAuthLoading) {
    return <div className="text-center p-10">Loading authentication...</div>;
  }

  if (!user) {
    // In a real app, you'd redirect to a login page
    if (typeof window !== 'undefined') {
        router.push('/login');
    }
    return null;
  }

  if (!projectId || typeof projectId !== 'string') {
    return <div className="text-center p-10">Invalid Project ID</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Live Project Walkthrough</h1>
        <p className="text-gray-500 mt-1">Project ID: {projectId}</p>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <LiveVideoChat projectId={projectId} userId={user.id} />
        </div>
        <aside className="lg:col-span-1">
            <div className="mt-6 p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg">
              <h3 className="text-lg font-bold text-yellow-800">How it works:</h3>
              <p className="text-yellow-700 mt-2">
                Point your camera at the areas of your home you want to discuss. Our AI agent can see what you see and will ask clarifying questions in real-time to understand your project scope.
              </p>
            </div>
        </aside>
      </main>
    </div>
  );
};

export default LiveWalkthroughPage;