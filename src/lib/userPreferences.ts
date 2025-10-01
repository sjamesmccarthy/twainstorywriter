/**
 * User Preferences and Settings localStorage Utility
 *
 * This utility manages user-specific preferences and settings stored in localStorage.
 * All data is keyed by user email to ensure proper data isolation between users.
 */

export interface Plan {
  type: "freelance" | "professional";
  status: "active" | "expired" | "cancelled";
  startDate?: string;
  endDate?: string;
  features?: string[];
}

export interface UserPreferences {
  // Plan and subscription info
  plan: Plan;

  // Account metadata
  accountCreatedAt: string;
  lastLoginAt: string;
  loginCount: number;

  // User interface preferences
  theme: "light" | "dark" | "auto";
  sidebarCollapsed: boolean;
  defaultView: "bookshelf" | "write" | "manage";

  // Writing preferences
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  wordCountGoal?: number;
  preferredFontSize: number;
  preferredFontFamily: string;

  // Notification preferences
  showNotifications: boolean;
  showWordCountNotifications: boolean;
  showSaveNotifications: boolean;

  // Export preferences
  defaultExportFormat: "pdf" | "docx" | "txt" | "html";
  includeMetadataInExport: boolean;

  // Privacy and data preferences
  analyticsOptIn: boolean;
  shareUsageData: boolean;

  // Feature flags and beta access
  betaFeatures: string[];
  experimentalFeatures: string[];

  // Recent activity tracking
  recentBooks: string[]; // book IDs
  recentStories: string[]; // story IDs

  // Custom settings
  customSettings: Record<string, unknown>;
}

// Default preferences for new users
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  plan: {
    type: "freelance",
    status: "active",
    startDate: new Date().toISOString(),
    features: ["local-storage", "basic-writing", "export-txt", "up-to-1-book"],
  },
  accountCreatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  loginCount: 1,
  theme: "auto",
  sidebarCollapsed: false,
  defaultView: "bookshelf",
  autoSave: true,
  autoSaveInterval: 30,
  preferredFontSize: 14,
  preferredFontFamily: "'Rubik', sans-serif",
  showNotifications: true,
  showWordCountNotifications: true,
  showSaveNotifications: true,
  defaultExportFormat: "pdf",
  includeMetadataInExport: true,
  analyticsOptIn: false,
  shareUsageData: false,
  betaFeatures: [],
  experimentalFeatures: [],
  recentBooks: [],
  recentStories: [],
  customSettings: {},
};

/**
 * Get the localStorage key for user preferences
 */
const getUserPreferencesKey = (userEmail: string): string => {
  return `twain-user-preferences-${userEmail}`;
};

/**
 * Load user preferences from localStorage
 */
export const loadUserPreferences = (userEmail?: string): UserPreferences => {
  if (typeof window === "undefined" || !userEmail) {
    return DEFAULT_USER_PREFERENCES;
  }

  try {
    const storageKey = getUserPreferencesKey(userEmail);
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      // First time user - create default preferences
      const newPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        accountCreatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
      };
      saveUserPreferences(newPreferences, userEmail);
      return newPreferences;
    }

    const preferences = JSON.parse(stored) as UserPreferences;

    // Merge with defaults to ensure all properties exist (for updates/migrations)
    const mergedPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      ...preferences,
    };

    // Migrate plan features if needed
    if (
      mergedPreferences.plan.type === "freelance" &&
      mergedPreferences.plan.features &&
      !mergedPreferences.plan.features.includes("up-to-1-book")
    ) {
      mergedPreferences.plan.features = [
        ...mergedPreferences.plan.features,
        "up-to-1-book",
      ];
      // Save the migrated preferences
      saveUserPreferences(mergedPreferences, userEmail);
    }

    // Migrate endDate for professional plans if missing
    if (
      mergedPreferences.plan.type === "professional" &&
      mergedPreferences.plan.startDate &&
      !mergedPreferences.plan.endDate
    ) {
      const startDate = new Date(mergedPreferences.plan.startDate);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year

      mergedPreferences.plan.endDate = endDate.toISOString();
      // Save the migrated preferences
      saveUserPreferences(mergedPreferences, userEmail);
    }

    return mergedPreferences;
  } catch (error) {
    console.error("Error loading user preferences:", error);
    return DEFAULT_USER_PREFERENCES;
  }
};

/**
 * Record a new login session - should only be called on actual authentication
 */
export const recordUserLogin = (userEmail?: string): void => {
  if (typeof window === "undefined" || !userEmail) {
    return;
  }

  try {
    const storageKey = getUserPreferencesKey(userEmail);
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      // This shouldn't happen if loadUserPreferences was called first
      // but handle it just in case
      const newPreferences = {
        ...DEFAULT_USER_PREFERENCES,
        accountCreatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
      };
      saveUserPreferences(newPreferences, userEmail);
      return;
    }

    const preferences = JSON.parse(stored) as UserPreferences;
    const now = new Date().toISOString();

    // Check if this is a new session (more than 30 minutes since last login)
    const lastLogin = new Date(preferences.lastLoginAt);
    const currentTime = new Date();
    const timeDiff = currentTime.getTime() - lastLogin.getTime();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Only increment if it's been more than 30 minutes since last recorded login
    if (timeDiff > thirtyMinutes) {
      const updatedPreferences = {
        ...preferences,
        lastLoginAt: now,
        loginCount: (preferences.loginCount || 0) + 1,
      };

      saveUserPreferences(updatedPreferences, userEmail);
    } else {
      // Just update the last login time without incrementing count
      const updatedPreferences = {
        ...preferences,
        lastLoginAt: now,
      };

      saveUserPreferences(updatedPreferences, userEmail);
    }
  } catch (error) {
    console.error("Error recording user login:", error);
  }
};

/**
 * Save user preferences to localStorage
 */
export const saveUserPreferences = (
  preferences: UserPreferences,
  userEmail?: string
): void => {
  if (typeof window === "undefined" || !userEmail) {
    return;
  }

  try {
    const storageKey = getUserPreferencesKey(userEmail);
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving user preferences:", error);
  }
};

/**
 * Update specific user preference
 */
export const updateUserPreference = <K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
  userEmail?: string
): void => {
  if (!userEmail) return;

  const currentPreferences = loadUserPreferences(userEmail);
  const updatedPreferences = {
    ...currentPreferences,
    [key]: value,
  };

  saveUserPreferences(updatedPreferences, userEmail);
};

/**
 * Update user plan information
 */
export const updateUserPlan = (
  planInfo: Partial<Plan>,
  userEmail?: string
): void => {
  if (!userEmail) return;

  const currentPreferences = loadUserPreferences(userEmail);
  const updatedPreferences = {
    ...currentPreferences,
    plan: {
      ...currentPreferences.plan,
      ...planInfo,
    },
  };

  saveUserPreferences(updatedPreferences, userEmail);
};

/**
 * Check if user has a specific feature based on their plan
 */
export const hasFeature = (feature: string, userEmail?: string): boolean => {
  if (!userEmail) return false;

  const preferences = loadUserPreferences(userEmail);
  return preferences.plan.features?.includes(feature) || false;
};

/**
 * Get user's current plan type
 */
export const getUserPlanType = (userEmail?: string): Plan["type"] => {
  if (!userEmail) return "freelance";

  const preferences = loadUserPreferences(userEmail);
  return preferences.plan.type;
};

/**
 * Check if user's plan is active
 */
export const isPlanActive = (userEmail?: string): boolean => {
  if (!userEmail) return false;

  const preferences = loadUserPreferences(userEmail);

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
};

/**
 * Add a book/story to recent activity
 */
export const addToRecentActivity = (
  type: "book" | "story",
  id: string,
  userEmail?: string
): void => {
  if (!userEmail) return;

  const preferences = loadUserPreferences(userEmail);
  const key = type === "book" ? "recentBooks" : "recentStories";
  const currentList = preferences[key] || [];

  // Remove existing entry if it exists
  const filteredList = currentList.filter((existingId) => existingId !== id);

  // Add to front of list and limit to 10 items
  const updatedList = [id, ...filteredList].slice(0, 10);

  updateUserPreference(key, updatedList, userEmail);
};

/**
 * Get account age in days
 */
export const getAccountAgeInDays = (userEmail?: string): number => {
  if (!userEmail) return 0;

  const preferences = loadUserPreferences(userEmail);
  const createdDate = new Date(preferences.accountCreatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Get last login information
 */
export const getLastLoginInfo = (
  userEmail?: string
): {
  lastLogin: string;
  loginCount: number;
  accountAge: number;
} => {
  if (!userEmail) {
    return {
      lastLogin: new Date().toISOString(),
      loginCount: 0,
      accountAge: 0,
    };
  }

  const preferences = loadUserPreferences(userEmail);

  return {
    lastLogin: preferences.lastLoginAt,
    loginCount: preferences.loginCount,
    accountAge: getAccountAgeInDays(userEmail),
  };
};

/**
 * Clear all user preferences (for account deletion)
 */
export const clearUserPreferences = (userEmail?: string): void => {
  if (typeof window === "undefined" || !userEmail) {
    return;
  }

  try {
    const storageKey = getUserPreferencesKey(userEmail);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Error clearing user preferences:", error);
  }
};

/**
 * Manually migrate user preferences to add missing endDate for professional plans
 * This can be called to fix existing users
 */
export const migrateUserPreferencesEndDate = (userEmail?: string): void => {
  if (!userEmail) return;

  const preferences = loadUserPreferences(userEmail);

  // Add endDate for professional plans if missing
  if (
    preferences.plan.type === "professional" &&
    preferences.plan.startDate &&
    !preferences.plan.endDate
  ) {
    const startDate = new Date(preferences.plan.startDate);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year

    updateUserPlan({ endDate: endDate.toISOString() }, userEmail);
    console.log(
      `Added endDate for professional plan: ${endDate.toISOString()}`
    );
  }
};

/**
 * Export user preferences to JSON string for backup
 */
export const exportUserPreferences = (userEmail?: string): string | null => {
  if (!userEmail) return null;

  try {
    const preferences = loadUserPreferences(userEmail);
    return JSON.stringify(preferences, null, 2);
  } catch (error) {
    console.error("Error exporting user preferences:", error);
    return null;
  }
};

/**
 * Import user preferences from backup
 */
export const importUserPreferences = (
  preferencesJson: string,
  userEmail?: string
): boolean => {
  if (!userEmail) return false;

  try {
    const preferences = JSON.parse(preferencesJson) as UserPreferences;

    // Validate the structure (basic check)
    if (!preferences.plan || !preferences.accountCreatedAt) {
      throw new Error("Invalid preferences format");
    }

    saveUserPreferences(preferences, userEmail);
    return true;
  } catch (error) {
    console.error("Error importing user preferences:", error);
    return false;
  }
};

/**
 * Feature flags and experimental features
 */
export const enableBetaFeature = (
  feature: string,
  userEmail?: string
): void => {
  if (!userEmail) return;

  const preferences = loadUserPreferences(userEmail);
  const updatedFeatures = Array.from(
    new Set([...preferences.betaFeatures, feature])
  );

  updateUserPreference("betaFeatures", updatedFeatures, userEmail);
};

export const disableBetaFeature = (
  feature: string,
  userEmail?: string
): void => {
  if (!userEmail) return;

  const preferences = loadUserPreferences(userEmail);
  const updatedFeatures = preferences.betaFeatures.filter((f) => f !== feature);

  updateUserPreference("betaFeatures", updatedFeatures, userEmail);
};

export const isBetaFeatureEnabled = (
  feature: string,
  userEmail?: string
): boolean => {
  if (!userEmail) return false;

  const preferences = loadUserPreferences(userEmail);
  return preferences.betaFeatures.includes(feature);
};
