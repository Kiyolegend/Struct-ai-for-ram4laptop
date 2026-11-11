import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const SYMBOL_SETTINGS_KEY = ["symbol-settings"] as const;
export const DEFAULT_ACTIVE_SYMBOLS = ["USD/JPY", "EUR/USD", "XAU/USD", "BTC/USD"];

export interface SymbolSettings {
  active_symbols: string[];
  available_symbols: string[];
}

export function useSymbolSettings() {
  const queryClient = useQueryClient();
  const query = useQuery<SymbolSettings>({
    queryKey: SYMBOL_SETTINGS_KEY,
    queryFn: async () => {
      const response = await fetch("/trading-api/symbols/settings");
      if (!response.ok) throw new Error(`Unable to load symbol settings (${response.status})`);
      return response.json();
    },
    staleTime: 30_000,
    retry: 2,
  });

  const mutation = useMutation({
    mutationFn: async (active_symbols: string[]) => {
      const response = await fetch("/trading-api/symbols/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_symbols }),
      });
      if (!response.ok) throw new Error(`Unable to save symbol settings (${response.status})`);
      return response.json() as Promise<SymbolSettings>;
    },
    onMutate: async (active_symbols) => {
      await queryClient.cancelQueries({ queryKey: SYMBOL_SETTINGS_KEY });
      const previous = queryClient.getQueryData<SymbolSettings>(SYMBOL_SETTINGS_KEY);
      queryClient.setQueryData<SymbolSettings>(SYMBOL_SETTINGS_KEY, (current) => ({
        active_symbols,
        available_symbols: current?.available_symbols ?? [],
      }));
      return { previous };
    },
    onError: (_error, _active_symbols, context) => {
      if (context?.previous) queryClient.setQueryData(SYMBOL_SETTINGS_KEY, context.previous);
    },
    onSuccess: (settings) => queryClient.setQueryData(SYMBOL_SETTINGS_KEY, settings),
    onSettled: (_data, _error, active_symbols) => {
      const active = new Set(active_symbols);
      const symbolQueries = new Set([
        "sr-levels", "zones-mtf", "mtf-bias", "pattern-summary", "bos-choch",
        "choch", "sessions", "trading-analysis", "confluence",
      ]);
      void queryClient.invalidateQueries({ queryKey: SYMBOL_SETTINGS_KEY });
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const [group, symbol] = query.queryKey;
          return typeof group === "string" && symbolQueries.has(group)
            && typeof symbol === "string" && active.has(symbol);
        },
      });
    },
  });

  return {
    ...query,
    activeSymbols: query.data?.active_symbols ?? DEFAULT_ACTIVE_SYMBOLS,
    setActiveSymbols: mutation.mutate,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
}
