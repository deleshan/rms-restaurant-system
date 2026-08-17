import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full text-center p-10 md:p-12">
          <div className="mb-8">
            <div className="text-8xl md:text-9xl font-black text-indigo-600 opacity-80">
              404
            </div>
            <p className="mt-2 text-2xl md:text-3xl font-bold text-gray-800">
              Page Not Found
            </p>
          </div>

          <p className="text-lg text-gray-600 mb-10 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Home size={20} />}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>

            <Button
              variant="outline"
              size="lg"
              leftIcon={<ArrowLeft size={20} />}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>

          {/* Helpful links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Or try searching:</p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu, orders, customers..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Extra navigation */}
          <div className="mt-10 text-sm text-gray-500">
            <Link to="/menu" className="text-indigo-600 hover:underline mx-2">
              Browse Menu
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/orders" className="text-indigo-600 hover:underline mx-2">
              View Orders
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/customers" className="text-indigo-600 hover:underline mx-2">
              Customers
            </Link>
          </div>
        </Card>
      </main>

    </div>
  );
};

export default NotFoundPage;