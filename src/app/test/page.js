export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Test Page
        </h1>
        <p className="text-gray-600 mb-4">
          If you can see this, the deployment is working!
        </p>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Environment Check:</h2>
          <p>Node ENV: {process.env.NODE_ENV}</p>
          <p>Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</p>
          <p>Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</p>
        </div>
        <a 
          href="/" 
          className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}