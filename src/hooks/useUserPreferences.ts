/**
 * React Hook for User Preferences
 *
 * This hook provides a convenient way to access and update user preferences
 * in React components with automatic re-rendering when preferences change.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  UserPreferences,
  Plan,
  loadUserPreferences,
  saveUserPreferences,
  updateUserPreference,
  updateUserPlan,
  addToRecentActivity,
  getLastLoginInfo,
  recordUserLogin,
  DEFAULT_USER_PREFERENCES,
} from "../lib/userPreferences";

export interface UseUserPreferencesReturn {
  // Current preferences state
  preferences: UserPreferences;
  isLoading: boolean;

  // Preference getters
  planType: Plan["type"];
  isActivePlan: boolean;
  loginInfo: { lastLogin: string; loginCount: number; accountAge: number };

  // Preference updaters
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  updatePlan: (planInfo: Partial<Plan>) => void;
  addToRecent: (type: "book" | "story", id: string) => void;

  // Login tracking
  recordLogin: () => void;

  // Feature checks
  checkFeature: (feature: string) => boolean;

  // Utility functions
  refreshPreferences: () => void;
  resetToDefaults: () => void;
}

/**
 * Custom hook for managing user preferences
 */
export const useUserPreferences = (): UseUserPreferencesReturn => {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_USER_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState(true);

  const userEmail = session?.user?.email;

  // Load preferences when user email changes
  useEffect(() => {
    if (userEmail) {
      setIsLoading(true);
      try {
        const loadedPreferences = loadUserPreferences(userEmail);
        setPreferences(loadedPreferences);
      } catch (error) {
        console.error("Error loading user preferences:", error);
        setPreferences(DEFAULT_USER_PREFERENCES);
      } finally {
        setIsLoading(false);
      }
    } else {
      setPreferences(DEFAULT_USER_PREFERENCES);
      setIsLoading(false);
    }
  }, [userEmail]);

  // Update a specific preference
  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      if (!userEmail) return;

      const updatedPreferences = {
        ...preferences,
        [key]: value,
      };

      setPreferences(updatedPreferences);
      updateUserPreference(key, value, userEmail);
    },
    [preferences, userEmail]
  );

  // Update plan information
  const updatePlan = useCallback(
    (planInfo: Partial<Plan>) => {
      if (!userEmail) return;

      const updatedPreferences = {
        ...preferences,
        plan: {
          ...preferences.plan,
          ...planInfo,
        },
      };

      setPreferences(updatedPreferences);
      updateUserPlan(planInfo, userEmail);
    },
    [preferences, userEmail]
  );

  // Add to recent activity
  const addToRecent = useCallback(
    (type: "book" | "story", id: string) => {
      if (!userEmail) return;

      const key = type === "book" ? "recentBooks" : "recentStories";
      const currentList = preferences[key] || [];

      // Remove existing entry if it exists
      const filteredList = currentList.filter(
        (existingId) => existingId !== id
      );

      // Add to front of list and limit to 10 items
      const updatedList = [id, ...filteredList].slice(0, 10);

      updatePreference(key, updatedList);
      addToRecentActivity(type, id, userEmail);
    },
    [preferences, userEmail, updatePreference]
  );

  // Check if user has a feature
  const checkFeature = useCallback(
    (feature: string): boolean => {
      if (!userEmail || isLoading) return false;

      // Use current preferences state instead of re-loading from localStorage
      return preferences.plan.features?.includes(feature) || false;
    },
    [userEmail, isLoading, preferences.plan.features]
  );

  // Refresh preferences from localStorage
  const refreshPreferences = useCallback(() => {
    if (userEmail) {
      const freshPreferences = loadUserPreferences(userEmail);
      setPreferences(freshPreferences);
    }
  }, [userEmail]);

  // Reset to default preferences
  const resetToDefaults = useCallback(() => {
    if (!userEmail) return;

    const defaultPrefs = {
      ...DEFAULT_USER_PREFERENCES,
      accountCreatedAt: preferences.accountCreatedAt, // Preserve original creation date
      loginCount: preferences.loginCount, // Preserve login count
      lastLoginAt: new Date().toISOString(), // Update last login
    };

    setPreferences(defaultPrefs);
    saveUserPreferences(defaultPrefs, userEmail);
  }, [preferences, userEmail]);

  // Record login function
  const recordLogin = useCallback(() => {
    if (userEmail) {
      recordUserLogin(userEmail);
      // Refresh preferences to get updated login info
      refreshPreferences();
    }
  }, [userEmail, refreshPreferences]);

  // Derived values from current state
  const planType = preferences.plan.type;

  const isActivePlan = useMemo(() => {
    if (preferences.plan.status !== "active") {
      return false;
    }

    // Check if plan has expired
    if (preferences.plan.endDate) {
      const endDate = new Date(preferences.plan.endDate);
      const now = new Date();
      return now <= endDate;
    }

    return true;
  }, [preferences.plan.status, preferences.plan.endDate]);

  const loginInfo = getLastLoginInfo(userEmail || undefined);

  return {
    preferences,
    isLoading,
    planType,
    isActivePlan,
    loginInfo,
    updatePreference,
    updatePlan,
    addToRecent,
    recordLogin,
    checkFeature,
    refreshPreferences,
    resetToDefaults,
  };
};

/**
 * Hook specifically for plan-related functionality
 */
export const useUserPlan = () => {
  const { preferences, updatePlan, checkFeature, planType, isActivePlan } =
    useUserPreferences();

  const upgradePlan = useCallback(
    (newPlanType: Plan["type"]) => {
      const planFeatures = getPlanFeatures(newPlanType);

      updatePlan({
        type: newPlanType,
        status: "active",
        startDate: new Date().toISOString(),
        endDate: getPlanEndDate(newPlanType),
        features: planFeatures,
      });
    },
    [updatePlan]
  );

  const cancelPlan = useCallback(() => {
    updatePlan({
      status: "cancelled",
      endDate: new Date().toISOString(),
    });
  }, [updatePlan]);

  const renewPlan = useCallback(() => {
    updatePlan({
      status: "active",
      endDate: getPlanEndDate(planType),
    });
  }, [updatePlan, planType]);

  return {
    plan: preferences.plan,
    planType,
    isActivePlan,
    checkFeature,
    upgradePlan,
    cancelPlan,
    renewPlan,
  };
};

/**
 * Get features available for each plan type
 */
const getPlanFeatures = (planType: Plan["type"]): string[] => {
  const features: Record<Plan["type"], string[]> = {
    freelance: ["local-storage", "basic-writing", "export-txt", "up-to-1-book"],
    professional: [
      "cloud-storage",
      "unlimited-books",
      "advanced-writing",
      "export-all-formats",
      "premium-templates",
      "import-docx",
      "collaboration",
      "version-history",
      "priority-support",
      "custom-branding",
      "publish-kindle-epub",
    ],
  };

  return features[planType] || features.freelance;
};

/**
 * Get plan end date based on plan type (assuming annual billing)
 */
const getPlanEndDate = (planType: Plan["type"]): string | undefined => {
  if (planType === "freelance") {
    return undefined; // Freelance plan doesn't expire
  }

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year
  return endDate.toISOString();
};
