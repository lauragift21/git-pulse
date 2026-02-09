import { useState, useCallback, useRef, useEffect } from "react";
import {
  Search,
  Star,
  Check,
  X,
  Github,
  ArrowRight,
  Loader2,
  AlertCircle,
  BookMarked,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useGitHubToken } from "@/hooks/useGitHubToken";
import { useTrackedRepos } from "@/hooks/useTrackedRepos";
import { fetchUserInfo } from "@/api/events";
import { searchRepos, fetchUserRepos } from "@/api/repositories";
import { getLanguageColor } from "@/lib/colors";

interface SetupProps {
  onComplete: () => void;
}

interface UserInfo {
  login: string;
  avatar_url: string;
  name: string | null;
  id: number;
  html_url: string;
}

interface RepoResult {
  id: number;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  owner: { avatar_url: string };
}

export function Setup({ onComplete }: SetupProps) {
  const { isAuthenticated, oauthError, clearOauthError, removeToken } =
    useGitHubToken();
  const { repos: trackedRepos, addRepo, removeRepo } = useTrackedRepos();

  // Step 1 state
  const [isValidating, setIsValidating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(oauthError);
  const [user, setUser] = useState<UserInfo | null>(null);

  // Step 2 state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RepoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef(0);

  // Recent repos state
  const [recentRepos, setRecentRepos] = useState<RepoResult[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // Clear the OAuth error from the hook once we've captured it
  useEffect(() => {
    if (oauthError) {
      setAuthError(oauthError);
      clearOauthError();
    }
  }, [oauthError, clearOauthError]);

  // Auto-validate token on mount if we already have one (e.g. after OAuth redirect)
  useEffect(() => {
    if (!isAuthenticated || user) return;

    let cancelled = false;
    setIsValidating(true);
    setAuthError(null);

    fetchUserInfo()
      .then((userInfo) => {
        if (!cancelled) setUser(userInfo);
      })
      .catch((err) => {
        if (!cancelled) {
          // Token is invalid — clear it so the user can try again
          removeToken();
          setAuthError(
            err instanceof Error
              ? err.message.includes("401")
                ? "Authentication failed. Please sign in again."
                : err.message
              : "Failed to validate token.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsValidating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, removeToken]);

  // Fetch the 5 most recent repos once the user is authenticated
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setIsLoadingRecent(true);

    fetchUserRepos()
      .then((repos) => {
        if (!cancelled) {
          setRecentRepos(repos.slice(0, 5));
        }
      })
      .catch(() => {
        // Silently ignore — recent repos are optional suggestions
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRecent(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSignIn = useCallback(() => {
    setAuthError(null);
    // Navigate to the Worker's OAuth login endpoint
    window.location.href = "/auth/login";
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const currentRequestId = ++searchRequestIdRef.current;
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchRepos(query);
        // Only update if this is still the latest request
        if (currentRequestId === searchRequestIdRef.current) {
          setSearchResults(results);
        }
      } catch {
        if (currentRequestId === searchRequestIdRef.current) {
          setSearchResults([]);
        }
      } finally {
        if (currentRequestId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, 400);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const isTracked = useCallback(
    (fullName: string) => trackedRepos.includes(fullName),
    [trackedRepos],
  );

  const toggleRepo = useCallback(
    (fullName: string) => {
      if (isTracked(fullName)) {
        removeRepo(fullName);
      } else {
        addRepo(fullName);
      }
    },
    [isTracked, addRepo, removeRepo],
  );

  const isStep1Complete = !!user;
  const canLaunch = trackedRepos.length > 0;

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      {/* Background gradient accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/gitpulse-logo.png"
              alt="GitPulse"
              className="w-14 h-14 rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome to GitPulse
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Connect your GitHub account and pick repositories to track.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <StepIndicator
            step={1}
            label="Connect"
            active
            complete={isStep1Complete}
          />
          <div
            className={`w-10 h-px ${isStep1Complete ? "bg-accent-blue" : "bg-border-primary"} transition-colors duration-300`}
          />
          <StepIndicator
            step={2}
            label="Repos"
            active={isStep1Complete}
            complete={canLaunch}
          />
        </div>

        {/* Step 1: GitHub OAuth */}
        <Card padding="lg" className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-blue/10 text-accent-blue text-xs font-bold">
              1
            </span>
            <h2 className="text-sm font-semibold text-text-primary">
              Connect GitHub Account
            </h2>
          </div>

          {!isStep1Complete ? (
            <div className="space-y-3">
              {isValidating ? (
                <div className="flex items-center justify-center gap-2 py-4 text-text-secondary text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting to GitHub...
                </div>
              ) : (
                <>
                  {authError && (
                    <div className="flex items-start gap-2 text-accent-red text-xs">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleSignIn}
                  >
                    <Github className="w-4 h-4" />
                    Sign in with GitHub
                  </Button>

                  <p className="text-xs text-text-tertiary text-center">
                    You'll be redirected to GitHub to authorize access.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-accent-green/5 border border-accent-green/20 p-3">
              <Avatar src={user.avatar_url} alt={user.login} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user.name ?? user.login}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  @{user.login}
                </p>
              </div>
              <Check className="w-5 h-5 text-accent-green shrink-0" />
            </div>
          )}
        </Card>

        {/* Step 2: Repository selection */}
        <Card
          padding="lg"
          className={`mb-6 transition-opacity duration-300 ${isStep1Complete ? "opacity-100" : "opacity-40 pointer-events-none"}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                isStep1Complete
                  ? "bg-accent-blue/10 text-accent-blue"
                  : "bg-bg-tertiary text-text-tertiary"
              }`}
            >
              2
            </span>
            <h2 className="text-sm font-semibold text-text-primary">
              Select Repositories
            </h2>
          </div>

          {/* Search input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search GitHub repositories..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={!isStep1Complete}
              className="w-full rounded-lg border border-border-primary bg-bg-primary pl-9 pr-3.5 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary animate-spin" />
            )}
          </div>

          {/* Recent repos suggestions */}
          {!searchQuery.trim() &&
            (isLoadingRecent || recentRepos.length > 0) && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Recent Repositories
                  </span>
                </div>
                {isLoadingRecent ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-text-secondary text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading your repos...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentRepos.map((repo) => {
                      const tracked = isTracked(repo.full_name);
                      return (
                        <button
                          key={repo.id}
                          type="button"
                          onClick={() => toggleRepo(repo.full_name)}
                          className={`w-full text-left rounded-lg border p-3 transition-all duration-150 cursor-pointer ${
                            tracked
                              ? "border-accent-blue/40 bg-accent-blue/5"
                              : "border-border-primary bg-bg-primary hover:border-border-primary/80 hover:bg-bg-hover"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar
                              src={repo.owner.avatar_url}
                              alt={repo.full_name}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-text-primary truncate">
                                  {repo.full_name}
                                </span>
                                {tracked && (
                                  <Check className="w-3.5 h-3.5 text-accent-blue shrink-0" />
                                )}
                              </div>
                              {repo.description && (
                                <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                                  {repo.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5">
                                {repo.language && (
                                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: getLanguageColor(
                                          repo.language,
                                        ),
                                      }}
                                    />
                                    {repo.language}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs text-text-secondary">
                                  <Star className="w-3 h-3" />
                                  {repo.stargazers_count.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {searchResults.map((repo) => {
                const tracked = isTracked(repo.full_name);
                return (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => toggleRepo(repo.full_name)}
                    className={`w-full text-left rounded-lg border p-3 transition-all duration-150 cursor-pointer ${
                      tracked
                        ? "border-accent-blue/40 bg-accent-blue/5"
                        : "border-border-primary bg-bg-primary hover:border-border-primary/80 hover:bg-bg-hover"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={repo.owner.avatar_url}
                        alt={repo.full_name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {repo.full_name}
                          </span>
                          {tracked && (
                            <Check className="w-3.5 h-3.5 text-accent-blue shrink-0" />
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {repo.language && (
                            <span className="flex items-center gap-1 text-xs text-text-secondary">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: getLanguageColor(
                                    repo.language,
                                  ),
                                }}
                              />
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-text-secondary">
                            <Star className="w-3 h-3" />
                            {repo.stargazers_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty search state */}
          {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-6 text-text-tertiary text-sm">
              No repositories found for "{searchQuery}"
            </div>
          )}

          {/* Tracked repos */}
          {trackedRepos.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookMarked className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Tracking ({trackedRepos.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trackedRepos.map((name) => (
                  <Badge key={name} variant="info">
                    {name}
                    <button
                      type="button"
                      onClick={() => removeRepo(name)}
                      className="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Launch button */}
        <Button
          variant="primary"
          size="lg"
          className={`w-full transition-all duration-300 ${canLaunch ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
          onClick={onComplete}
          disabled={!canLaunch}
        >
          Launch Dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/** Small step indicator used in the header */
function StepIndicator({
  step,
  label,
  active,
  complete,
}: {
  step: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors duration-300 ${
          complete
            ? "bg-accent-blue text-text-inverse"
            : active
              ? "border-2 border-accent-blue text-accent-blue"
              : "border-2 border-border-primary text-text-tertiary"
        }`}
      >
        {complete ? <Check className="w-3.5 h-3.5" /> : step}
      </span>
      <span
        className={`text-xs font-medium transition-colors duration-300 ${active || complete ? "text-text-primary" : "text-text-tertiary"}`}
      >
        {label}
      </span>
    </div>
  );
}
