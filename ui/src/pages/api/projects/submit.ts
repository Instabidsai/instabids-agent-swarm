// This API route is no longer needed - requests go directly to Python FastAPI backend
// All /api/* routes are handled by main.py via Vercel configuration
export default function handler() {
  return new Response('API routes handled by Python backend', { status: 404 });
}
