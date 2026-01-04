import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        await signUp(email, password, username);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF1EF] to-[#F7D6D2] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-6 sm:mb-8">
          <img
            src="/logo.png"
            alt="Puzzle Place"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain mx-auto mb-3"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Puzzle Place</h1>
          <p className="text-sm sm:text-base text-gray-600">Deal or No Deal Game Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E56353] focus:border-transparent outline-none transition"
                required={!isLogin}
                placeholder="Enter your username"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E56353] focus:border-transparent outline-none transition"
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E56353] focus:border-transparent outline-none transition"
              required
              minLength={6}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E56353] hover:bg-[#D55445] text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span>Loading...</span>
            ) : isLogin ? (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-[#E56353] hover:text-[#D55445] font-medium text-sm sm:text-base"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

