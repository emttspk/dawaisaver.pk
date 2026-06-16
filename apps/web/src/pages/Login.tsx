export default function Login() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}