import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  X,
  Check,
  CreditCard,
  Loader2,
  Gift,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getGiftcardList, saveGiftcard } from "../../service/setting";
import { renderSuccessToast, renderErrorToast } from "../../utils/toast";
import { ContainLoader, ErrorHandle } from "../shared";

interface GiftCardImage {
  src: string;
  type: "card" | "logo";
  content_type: string;
}

interface GiftCardSku {
  min: number;
  max: number;
}

interface GiftCard {
  id: string;
  name: string;
  description: string;
  subcategory?: string;
  currency_codes: string[];
  images: GiftCardImage[];
  skus: GiftCardSku[];
  usage_instructions?: string;
}

const formatCategory = (str?: string) =>
  str ? str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "General";

const formatCurrency = (min: number, max: number, currency: string) =>
  `${currency} $${min.toFixed(0)} – $${max.toFixed(0)}`;

export const GiftCardSettings = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedInfoId, setExpandedInfoId] = useState<string | null>(null);

  // TanStack Query for Gift Cards List
  const { data: responseData, isLoading, isError, refetch } = useQuery({
    queryKey: ["giftcards-list"],
    queryFn: async () => {
      const response = await getGiftcardList();
      return response.data;
    },
  });

  const giftcards: GiftCard[] = responseData?.giftcards || [];

  // Sync selected and saved giftcard IDs whenever query data updates (or loads from cache)
  useEffect(() => {
    if (responseData?.selected?.giftcard_id) {
      setSavedId(responseData.selected.giftcard_id);
      setSelectedId((prev) => prev || responseData.selected.giftcard_id);
    }
  }, [responseData]);

  // TanStack Mutation for Saving Gift Card Selection
  const saveMutation = useMutation({
    mutationFn: async (giftcardId: string) => {
      const response = await saveGiftcard(giftcardId);
      return response.data;
    },
    onSuccess: (_, giftcardId) => {
      setSavedId(giftcardId);
      queryClient.invalidateQueries({ queryKey: ["giftcards-list"] });
      renderSuccessToast("Active reward preference updated successfully!");
    },
    onError: () => {
      renderErrorToast("Failed to save reward selection.");
    },
  });

  const handleSave = () => {
    if (!selectedId) return;
    saveMutation.mutate(selectedId);
  };

  // Extract unique subcategories
  const subcategories = Array.from(
    new Set(giftcards.map((gc) => formatCategory(gc.subcategory)).filter(Boolean))
  );

  const filtered = giftcards.filter((gc) => {
    const matchesCategory =
      activeCategory === "All" || formatCategory(gc.subcategory) === activeCategory;
    const matchesSearch =
      gc.name.toLowerCase().includes(search.toLowerCase()) ||
      (gc.subcategory ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (gc.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedCard = giftcards.find((gc) => gc.id === selectedId);
  const savedCard = giftcards.find((gc) => gc.id === savedId);
  const hasUnsavedChange = selectedId !== savedId;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-tertiary shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-base bg-primary-base/10 px-2.5 py-1 rounded-full border border-primary-base/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Member Rewards Program
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark-1 tracking-tight">
            Reward Selection
          </h1>
          <p className="text-grey-5 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Choose the active gift card featured in your studio's member reward program.
            Selected cards are automatically issued upon milestone achievements.
          </p>
        </div>

        {/* Current Active Badge */}
        {savedCard && (
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-xs">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-green-700 tracking-wider">
                Currently Active Reward
              </p>
              <p className="text-xs font-black text-dark-1 truncate max-w-[180px]">
                {savedCard.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <ContainLoader text="Loading reward options catalog..." className="py-20" />
      ) : isError ? (
        <ErrorHandle
          message="Failed to load rewards catalog. Please check your connection and try again."
          retry={() => refetch()}
          className="py-20"
        />
      ) : (
        <>
          {/* Filter Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-tertiary shadow-xs space-y-4">
            {/* Full-width Search Box */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-2" />
              <input
                type="text"
                placeholder="Search reward gift cards by brand name, category, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-3 bg-neutral-quaternary/40 border border-neutral-tertiary rounded-xl text-xs font-semibold text-dark-1 placeholder:text-grey-2 focus:outline-none focus:ring-2 focus:ring-primary-base/20 focus:border-primary-base transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-2 hover:text-dark-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Chips Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar pt-1 border-t border-neutral-tertiary/40">
              <button
                onClick={() => setActiveCategory("All")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${activeCategory === "All"
                  ? "bg-primary-base text-white shadow-xs"
                  : "bg-neutral-quaternary text-grey-5 hover:bg-neutral-tertiary hover:text-dark-1"
                  }`}
              >
                All Rewards ({giftcards.length})
              </button>
              {subcategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${activeCategory === cat
                    ? "bg-primary-base text-white shadow-xs"
                    : "bg-neutral-quaternary text-grey-5 hover:bg-neutral-tertiary hover:text-dark-1"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Gift Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((gc) => {
              const isSelected = selectedId === gc.id;
              const isSaved = savedId === gc.id;
              const cardImg = gc.images.find((i) => i.type === "card") || gc.images[0];
              const isExpanded = expandedInfoId === gc.id;

              return (
                <div
                  key={gc.id}
                  onClick={() => setSelectedId(gc.id)}
                  className={`group text-left rounded-3xl border-2 overflow-hidden transition-all duration-300 relative flex flex-col justify-between cursor-pointer ${isSelected
                    ? "border-primary-base bg-white shadow-xl ring-4 ring-primary-base/10"
                    : "border-neutral-tertiary hover:border-grey-3 bg-white hover:shadow-md"
                    }`}
                >
                  <div>
                    {/* Card Visual Header */}
                    <div className="h-48 overflow-hidden bg-neutral-quaternary/60 relative p-4 flex items-center justify-center">
                      {cardImg ? (
                        <img
                          src={cardImg.src}
                          alt={gc.name}
                          className="max-h-full w-auto object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift className="w-16 h-16 text-grey-3" />
                        </div>
                      )}

                      {/* Active / Selection Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {isSaved && (
                          <span className="text-[9px] font-black uppercase bg-green-600 text-white px-2 py-0.5 rounded-full shadow-md border border-white">
                            Active Selection
                          </span>
                        )}
                        {isSelected && (
                          <div className="bg-primary-base text-white rounded-full p-1.5 shadow-lg">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-dark-1 text-base line-clamp-1 group-hover:text-primary-base transition-colors">
                          {gc.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-grey-5 bg-neutral-quaternary px-2.5 py-1 rounded-lg border border-neutral-tertiary">
                          {formatCategory(gc.subcategory)}
                        </span>
                        {gc.currency_codes?.[0] && gc.skus?.[0] && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary-base bg-primary-base/10 px-2.5 py-1 rounded-lg border border-primary-base/20">
                            {formatCurrency(
                              gc.skus[0].min,
                              gc.skus[0].max,
                              gc.currency_codes[0]
                            )}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-grey-5 line-clamp-2 leading-relaxed font-medium">
                        {gc.description}
                      </p>
                    </div>
                  </div>

                  {/* Usage Instructions Dropdown */}
                  {gc.usage_instructions && (
                    <div className="px-5 pb-5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedInfoId(isExpanded ? null : gc.id);
                        }}
                        className="w-full flex items-center justify-between text-[11px] font-bold text-grey-5 hover:text-primary-base py-1.5 px-3 bg-neutral-quaternary/40 hover:bg-neutral-quaternary rounded-xl transition-all border border-neutral-tertiary/60"
                      >
                        <span className="flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          Redemption Details
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-neutral-quaternary/80 border border-neutral-tertiary rounded-xl text-[11px] text-grey-5 font-mono leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                          {gc.usage_instructions}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-neutral-tertiary">
              <CreditCard className="w-16 h-16 mx-auto text-neutral-tertiary mb-3" />
              <h3 className="text-base font-bold text-dark-1">No reward gift cards found</h3>
              <p className="text-grey-5 text-xs mt-1">
                Try adjusting your search filter or selecting a different category.
              </p>
            </div>
          )}
        </>
      )}

      {/* Floating Save Action Bar */}
      {selectedId && hasUnsavedChange && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40 animate-in slide-in-from-bottom duration-300">
          <div className="bg-dark-1 text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-primary-base text-white flex items-center justify-center font-black shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">
                  Selected: <span className="text-primary-secondary">{selectedCard?.name}</span>
                </p>
                <p className="text-[10px] text-grey-2 truncate">
                  Click save to make this card active for member milestone rewards.
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-primary-base text-white px-6 py-2.5 rounded-2xl font-black text-xs hover:bg-opacity-90 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saveMutation.isPending ? "Saving Selection..." : "Save Selection"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
