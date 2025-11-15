import React, { useState } from 'react';

interface ApiKeySetupProps {
  onKeySubmit: (key: string) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
      <div className="w-full max-w-lg p-8 space-y-6 bg-slate-800 rounded-lg shadow-2xl">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-teal-400 mb-2">Welcome to the AI Assistant</h1>
            <p className="text-slate-400">To power the smart features, this app needs a Google AI API Key.</p>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">How to get your free key:</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-semibold">Google AI Studio</a>.</li>
                <li>Sign in with your Google Account.</li>
                <li>Click the "Create API key" button.</li>
                <li>Copy the generated key and paste it below.</li>
            </ol>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-1">
              Paste your API Key here:
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google AI API Key"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-teal-600 font-bold rounded-lg hover:bg-teal-500 disabled:bg-slate-600 transition-colors"
          >
            Save and Start App
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center">
            Your API key is saved only in your browser's local storage and is never sent anywhere else.
        </p>
      </div>
    </div>
  );
};

export default ApiKeySetup;
