import React, { useState, useEffect } from 'react';

const ApiKeyManager = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if API key exists in session storage
    const savedKey = sessionStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsValid(true);
      onApiKeyChange(savedKey);
    } else {
      setShowModal(true);
    }
  }, [onApiKeyChange]);

  const validateApiKey = async (key) => {
    if (!key || !key.startsWith('sk-')) {
      setError('API key must start with "sk-"');
      return false;
    }

    setIsValidating(true);
    setError('');

    try {
      // Test the API key by making a simple request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsValid(true);
        sessionStorage.setItem('openai_api_key', key);
        onApiKeyChange(key);
        setShowModal(false);
        return true;
      } else {
        setError('Invalid API key. Please check your key and try again.');
        return false;
      }
    } catch (err) {
      setError('Failed to validate API key. Please check your internet connection.');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await validateApiKey(apiKey);
  };

  const handleClearKey = () => {
    setApiKey('');
    setIsValid(false);
    sessionStorage.removeItem('openai_api_key');
    onApiKeyChange('');
    setShowModal(true);
  };

  if (!showModal && isValid) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>OpenAI API Key Connected</span>
        <button
          onClick={handleClearKey}
          className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Change Key
        </button>
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">OpenAI API Key Required</h3>
                <p className="text-sm text-gray-600">Enter your API key to use document processing and search</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Your API key is secure:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Stored only in your browser session</li>
                      <li>• Cleared when you close the tab</li>
                      <li>• Used only for OpenAI API calls</li>
                      <li>• Never stored on our servers</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                <p>Don't have an API key? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Get one from OpenAI</a></p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isValidating || !apiKey}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Validating...
                    </>
                  ) : (
                    'Connect API Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiKeyManager;
