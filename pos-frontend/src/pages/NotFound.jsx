import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';

function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(ROUTES.ROOT);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-gray-300 mb-4">404</div>
          <div className="text-6xl mb-6">🍽️</div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            The page you're looking for seems to have left the menu.
          </p>
          <p className="text-gray-500">
            Don't worry, let's get you back to the restaurant!
          </p>
        </div>

        {/* Back to Home Button */}
        <button
          onClick={handleGoHome}
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            />
          </svg>
          Back to Home
        </button>

        {/* Additional Info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Error Code: 404 - Page Not Found</p>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
