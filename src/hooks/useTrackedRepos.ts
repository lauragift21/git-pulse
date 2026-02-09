import { useState, useCallback } from "react";
import {
  getTrackedRepos,
  setTrackedRepos,
  addTrackedRepo,
  removeTrackedRepo,
} from "@/lib/github";

export function useTrackedRepos() {
  const [repos, setRepos] = useState<string[]>(getTrackedRepos);

  const add = useCallback((fullName: string) => {
    addTrackedRepo(fullName);
    setRepos(getTrackedRepos());
  }, []);

  const remove = useCallback((fullName: string) => {
    removeTrackedRepo(fullName);
    setRepos(getTrackedRepos());
  }, []);

  const set = useCallback((newRepos: string[]) => {
    setTrackedRepos(newRepos);
    setRepos(newRepos);
  }, []);

  return {
    repos,
    addRepo: add,
    removeRepo: remove,
    setRepos: set,
    hasRepos: repos.length > 0,
  };
}
