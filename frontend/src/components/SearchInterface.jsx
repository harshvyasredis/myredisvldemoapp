import { useState, useEffect } from 'react'
import { Search, FileText, Zap, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const SearchInterface = ({ apiKey }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useState({
    limit: 10,
    threshold: 0.7
  })

  const performSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    if (!apiKey) {
      setError('OpenAI API key is required. Please set your API key first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/`, {
        params: {
          query: searchQuery.trim(),
          openai_api_key: apiKey,
          limit: searchParams.limit,
          threshold: searchParams.threshold
        }
      })

      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    performSearch()
  }

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
  }

  const highlightText = (text, query) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.trim().split(' ').join('|')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  const getSimilarityColor = (score) => {
    if (score >= 0.9) return 'text-green-600 bg-green-100'
    if (score >= 0.8) return 'text-blue-600 bg-blue-100'
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Semantic Search</h2>
        <p className="text-gray-600">
          Search across all your documents using natural language queries
        </p>
      </div>

      {/* Search Form */}
      <div className="card max-w-4xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Ask a question or describe what you're looking for..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            />
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Results:</label>
                <select
                  value={searchParams.limit}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Similarity:</label>
                <select
                  value={searchParams.threshold}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={0.3}>30%</option>
                  <option value={0.4}>40%</option>
                  <option value={0.5}>50%</option>
                  <option value={0.6}>60%</option>
                  <option value={0.7}>70%</option>
                  <option value={0.8}>80%</option>
                  <option value={0.9}>90%</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results ({results.length})
            </h3>
            <p className="text-sm text-gray-500">
              Showing results with {(searchParams.threshold * 100).toFixed(0)}%+ similarity
            </p>
          </div>
          
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={result.chunk_id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">{result.filename}</h4>
                      <p className="text-sm text-gray-500">Chunk {result.chunk_index + 1}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSimilarityColor(result.similarity_score)}`}>
                    {(result.similarity_score * 100).toFixed(1)}% match
                  </span>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {highlightText(result.content, query)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && query && results.length === 0 && !error && (
        <div className="max-w-4xl mx-auto text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search query or lowering the similarity threshold
          </p>
        </div>
      )}

      {/* Search Tips */}
      {!query && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-3">Search Tips:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Use natural language queries like "How to configure Redis?"</li>
              <li>• Ask specific questions about your documents</li>
              <li>• Try different similarity thresholds to find more or fewer results</li>
              <li>• Search works across all uploaded documents simultaneously</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchInterface
