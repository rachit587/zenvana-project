import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

const Auth = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      await onLoginSuccess();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEmailAuth = async () => {
    setError('');
    setMessage('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: new Date(),
        });
      }
      await onLoginSuccess();
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-4">
      <div className="bg-gray-900 bg-opacity-80 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
        <h2 className="text-4xl font-extrabold text-green-400 mb-6">ZENVANA</h2>
        <p className="text-xl mb-8">{isLogin ? "Welcome Back" : "Create Your Account"}</p>

        <button onClick={handleGoogleLogin} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg mb-4">
          Sign In with Google
        </button>

        <div className="relative my-6"><span className="absolute inset-x-0 top-1/2 border-t border-gray-700"></span><span className="relative z-10 bg-gray-900 px-4 text-sm text-gray-400">OR</span></div>

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 mb-4 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 mb-4 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" />

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {message && <p className="text-green-500 mb-4">{message}</p>}

        <button onClick={handleEmailAuth} className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl text-lg transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-2xl mb-4">
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <p className="text-gray-400 text-sm mt-4">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-green-400 hover:underline">
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>

        {isLogin && (
          <button onClick={handlePasswordReset} className="text-sm text-gray-400 mt-2 hover:underline">
            Forgot Password?
          </button>
        )}
      </div>
    </div>
  );
};

export default Auth;
