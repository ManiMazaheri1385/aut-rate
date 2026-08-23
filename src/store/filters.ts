import { create } from "zustand";
import type { SortValue } from "@/lib/constants";

/**
 * Client-side filter state shared between the search bar and list pages.
 */
interface FilterState {
  department: string; // "all" | DepartmentValue
  sort: SortValue;
  query: string;
  setDepartment: (department: string) => void;
  setSort: (sort: SortValue) => void;
  setQuery: (query: string) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  department: "all",
  sort: "highest_rated",
  query: "",
  setDepartment: (department) => set({ department }),
  setSort: (sort) => set({ sort }),
  setQuery: (query) => set({ query }),
  reset: () => set({ department: "all", sort: "highest_rated", query: "" }),
}));
