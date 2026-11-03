import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      setSettings(await api("/settings"));
      setError("");
    } catch (problem) {
      setError(problem.message);
    }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) refresh();
    });
    return () => {
      active = false;
    };
  }, [refresh]);
  return (
    <OrganizationContext.Provider value={{ settings, error, refresh }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const organization = useContext(OrganizationContext);
  if (!organization) throw new Error("OrganizationProvider is required");
  const gates =
    organization.settings?.gates.filter((item) => item.active).map((item) => item.name) || [];
  const departments =
    organization.settings?.departments.filter((item) => item.active).map((item) => item.name) || [];
  const historyGates = organization.settings?.gates.map((item) => item.name) || [];
  return { ...organization, gates, departments, historyGates };
}
