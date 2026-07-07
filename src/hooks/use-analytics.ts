"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

export function useAnalytics() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  return { data, isLoading };
}

export function useOverviewStats() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getOverviewStats().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  return { data, isLoading };
}
