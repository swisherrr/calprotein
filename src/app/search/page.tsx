"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import ProfilePicture from "@/components/ui/profile-picture";
import { useSearchParams } from "next/navigation";

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, username, profile_picture_url')
      .ilike('username', `%${query}%`)
      .limit(20);
    setResults(data || []);
    setLoading(false);
  };

  // Auto-search when query changes (debounced)
  useEffect(() => {
    if (query.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch({ preventDefault: () => {} } as React.FormEvent);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <div className="max-w-full mx-auto px-4 py-2">
      
      {/* Search Input */}
      <div className="bg-white dark:bg-black rounded-full p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by username"
              className="pl-12 h-12 rounded-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-base"
            />
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400">Searching...</div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map(user => (
            <Link 
              key={user.user_id} 
              href={`/user/${user.username}`}
              className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-black"
            >
              <ProfilePicture userId={user.user_id} size="md" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">@{user.username}</div>
              </div>
              <Users className="h-4 w-4 text-gray-400" />
            </Link>
          ))}
        </div>
      ) : query && !loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400">No users found.</div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-full mx-auto px-4 py-2">
        <div className="bg-white dark:bg-black rounded-full p-6 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by username"
                className="pl-12 h-12 rounded-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-base"
                disabled
              />
            </div>
          </div>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
} 