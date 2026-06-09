import restaurantData from "@/data/restaurant-data.json";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Search, X, Leaf, Flame, Star, Wheat, Milk, Nut, Sprout, CircleDot } from "lucide-react";

const RESTAURANT_ID = "jamon-jamon";

type Tag = "vegetarian" | "vegan" | "gluten-free" | "spicy" | "popular" | "new" | "nuts" | "dairy-free";

const TAG_CONFIG: Record<Tag, { label: string; color: string; icon: React.FC<{ size: number }> }> = {
  vegetarian:    { label: "Vegetarian", color: "bg-green-50   text-green-700   border-green-100",   icon: (p) => <Leaf {...p} /> },
  vegan:         { label: "Vegan",      color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: (p) => <Sprout {...p} /> },
  "gluten-free": { label: "GF",         color: "bg-amber-50   text-amber-700   border-amber-100",   icon: (p) => <Wheat {...p} /> },
  spicy:         { label: "Spicy",      color: "bg-red-50     text-red-700     border-red-100",     icon: (p) => <Flame {...p} /> },
  popular:       { label: "Popular",    color: "bg-orange-50  text-orange-700  border-orange-100",  icon: (p) => <Star {...p} /> },
  new:           { label: "New",        color: "bg-blue-50    text-blue-700    border-blue-100",    icon: (p) => <CircleDot {...p} /> },
  nuts:          { label: "Nuts",       color: "bg-yellow-50  text-yellow-700  border-yellow-100",  icon: (p) => <Nut {...p} /> },
  "dairy-free":  { label: "Dairy-Free", color: "bg-sky-50     text-sky-700     border-sky-100",     icon: (p) => <Milk {...p} /> },
};

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function LogoPlaceholder({ name, primary }: { name: string; primary: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      className="w-14 h-14 flex-shrink-0 flex items-center justify-center border-2 border-white/40 shadow-lg"
      style={{ backgroundColor: primary }}
    >
      <span className="text-white font-serif text-lg font-bold tracking-widest">{initials}</span>
    </div>
  );
}

type ModalItem = { name: string; image: string | null; description: string };

function ImageModal({ item, primary, onClose }: { item: ModalItem; primary: string; onClose: () => void }) {
  const [phase, setPhase] = useState<"entering" | "open" | "leaving">("entering");

  useEffect(() => {
    const t = requestAnimationFrame(() => setPhase("open"));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleClose = () => {
    setPhase("leaving");
    setTimeout(onClose, 220);
  };

  const isVisible = phase === "open";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        backgroundColor: isVisible ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
        transition: "background-color 220ms ease",
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[380px] rounded-2xl overflow-hidden shadow-2xl bg-background"
        style={{
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.92) translateY(16px)",
          opacity: isVisible ? 1 : 0,
          transition: "transform 220ms cubic-bezier(0.25,0.46,0.45,0.94), opacity 220ms ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image area */}
        <div
          className="w-full aspect-square flex items-center justify-center"
          style={{ backgroundColor: `${primary}18` }}
        >
          {item.image
            ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            : <span className="text-8xl opacity-20">🍽</span>
          }
        </div>

        {/* Info */}
        <div className="p-5">
          <h3 className="font-serif text-[18px] font-semibold text-foreground mb-1">{item.name}</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{item.description}</p>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const restaurant = (restaurantData as typeof restaurantData).find((r) => r.id === RESTAURANT_ID) ?? restaurantData[0];

  const [search, setSearch] = useState("");
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const openModal = useCallback((item: ModalItem) => setModalItem(item), []);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollingProgrammatically = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const STICKY_HEIGHT = 108;

  useEffect(() => {
    const { theme } = restaurant;
    const s = document.documentElement.style;
    try {
      s.setProperty("--background",        hexToHsl(theme.background));
      s.setProperty("--foreground",        hexToHsl(theme.text));
      s.setProperty("--card",             hexToHsl(theme.surface));
      s.setProperty("--card-foreground",  hexToHsl(theme.text));
      s.setProperty("--primary",          hexToHsl(theme.primary));
      s.setProperty("--primary-foreground","0 0% 100%");
      s.setProperty("--muted",            hexToHsl(theme.accent));
      s.setProperty("--muted-foreground", hexToHsl(theme.textMuted));
      s.setProperty("--border",           hexToHsl(theme.accent));
    } catch { /* ignore */ }
    return () => {
      ["--background","--foreground","--card","--card-foreground","--primary","--primary-foreground","--muted","--muted-foreground","--border"]
        .forEach((v) => s.removeProperty(v));
    };
  }, [restaurant]);

  useEffect(() => {
    if (restaurant.categories.length && !activeCategory) {
      setActiveCategory(restaurant.categories[0].id);
    }
  }, [restaurant, activeCategory]);

  useEffect(() => {
    const onScroll = () => {
      if (scrollingProgrammatically.current) return;
      for (let i = restaurant.categories.length - 1; i >= 0; i--) {
        const el = categoryRefs.current[restaurant.categories[i].id];
        if (!el) continue;
        if (el.getBoundingClientRect().top <= STICKY_HEIGHT + 16) {
          setActiveCategory(restaurant.categories[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [restaurant]);

  // Keep the active tab scrolled into view whenever the category changes
  useEffect(() => {
    if (!activeCategory || scrollingProgrammatically.current) return;
    const tab = tabsRef.current?.querySelector(`[data-cat="${activeCategory}"]`) as HTMLElement | null;
    tab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategory]);

  const scrollToCategory = (catId: string) => {
    const el = categoryRefs.current[catId];
    if (!el) return;
    setActiveCategory(catId);
    scrollingProgrammatically.current = true;
    const offset = el.getBoundingClientRect().top + window.scrollY - STICKY_HEIGHT - 8;
    window.scrollTo({ top: offset, behavior: "smooth" });
    setTimeout(() => { scrollingProgrammatically.current = false; }, 900);
    const tab = tabsRef.current?.querySelector(`[data-cat="${catId}"]`) as HTMLElement | null;
    tab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restaurant.categories;
    return restaurant.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.tags.some((t) => t.includes(q)),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [restaurant, search]);

  const resultCount = filteredCategories.reduce((n, c) => n + c.items.length, 0);
  const primary = restaurant.theme.primary;

  return (
    <div className="min-h-screen bg-background max-w-[500px] mx-auto">
      {modalItem && <ImageModal key={modalItem.name} item={modalItem} primary={primary} onClose={() => setModalItem(null)} />}

      {/* Hero */}
      <div
        className="relative px-5 pt-12 pb-7 overflow-hidden"
        style={{ backgroundColor: primary }}
      >
        <div
          className="absolute inset-0 pointer-events-none select-none opacity-[0.06]"
          style={{ backgroundImage: `repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 12px)` }}
        />
        <div className="relative z-10 flex items-center gap-4">
          <LogoPlaceholder name={restaurant.name} primary={primary} />
          <div className="flex-1 min-w-0 text-white">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 mb-1">
              {restaurant.cuisine}
            </p>
            <h1 className="font-serif text-[26px] font-semibold leading-none tracking-tight">
              {restaurant.name}
            </h1>
          </div>
        </div>
        <p className="relative z-10 text-[12px] text-white/60 mt-4 leading-relaxed line-clamp-2 font-light tracking-wide">
          {restaurant.description}
        </p>
      </div>

      {/* Sticky: Search + Category tabs */}
      <div className="sticky top-0 z-30 bg-background shadow-md">
        <div className="px-4 pt-3 pb-2.5 border-b border-border/60">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="What are you looking for?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-muted text-foreground text-[13px] font-medium placeholder:text-muted-foreground placeholder:font-normal border-0 outline-none ring-0 focus:ring-0 rounded-none tracking-wide"
              style={{ WebkitAppearance: "none" }}
            />
            {search && (
              <button
                onClick={() => { setSearch(""); searchInputRef.current?.focus(); }}
                className="absolute right-2.5 flex items-center justify-center w-5 h-5 bg-muted-foreground/20 rounded-full text-muted-foreground hover:bg-muted-foreground/30 transition-colors"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        <div
          ref={tabsRef}
          className="flex overflow-x-auto scrollbar-hide border-b border-border/40"
          style={{ backgroundColor: primary }}
        >
          {restaurant.categories.map((cat) => {
            const isActive = !search && activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                data-cat={cat.id}
                onClick={() => { setSearch(""); scrollToCategory(cat.id); }}
                style={isActive ? {} : { WebkitTapHighlightColor: "transparent" }}
                className={`flex-shrink-0 px-4 py-3 text-[11px] font-bold tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-150 border-r border-white/10 last:border-r-0 ${
                  isActive ? "bg-background text-foreground" : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {search && (
          <div className="px-4 py-1.5 bg-background border-b border-border/40">
            <p className="text-[11px] text-muted-foreground font-medium tracking-wide">
              {resultCount === 0 ? "No items match your search" : `${resultCount} item${resultCount === 1 ? "" : "s"} found`}
            </p>
          </div>
        )}
      </div>

      {/* Menu sections */}
      <div className="pb-28">
        {filteredCategories.length === 0 && search && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <Search size={28} className="text-muted-foreground mb-3 opacity-40" />
            <p className="font-serif text-lg font-semibold text-foreground mb-1">Nothing found</p>
            <p className="text-sm text-muted-foreground">
              No dishes match <em>"{search}"</em> — try another keyword
            </p>
          </div>
        )}

        {filteredCategories.map((category) => (
          <div
            key={category.id}
            ref={(el) => { categoryRefs.current[category.id] = el; }}
          >
            <div className="px-5 pt-7 pb-1 flex items-baseline gap-3">
              <h2 className="font-serif text-[18px] font-semibold text-foreground tracking-tight">
                {category.name}
              </h2>
              {category.description && !search && (
                <span className="text-[11px] text-muted-foreground font-normal tracking-wide truncate">
                  {category.description}
                </span>
              )}
            </div>
            <div className="mx-5 mb-3 h-px" style={{ backgroundColor: primary, opacity: 0.2 }} />
            <div className="px-4 space-y-0">
              {category.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`relative py-4 px-1 ${idx < category.items.length - 1 ? "border-b border-border/50" : ""} ${!item.available ? "opacity-40" : ""}`}
                >
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-[14px] font-semibold text-foreground leading-snug tracking-tight">
                          {item.name}
                          {!item.available && (
                            <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 tracking-widest uppercase text-muted-foreground border border-border/60 align-middle">
                              SOLD OUT
                            </span>
                          )}
                        </h3>
                        <span
                          className="flex-shrink-0 text-[15px] font-bold tabular-nums tracking-tight"
                          style={{ color: primary }}
                        >
                          £{item.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {item.tags.map((tag) => {
                            const cfg = TAG_CONFIG[tag as Tag];
                            if (!cfg) return null;
                            const Icon = cfg.icon;
                            return (
                              <span
                                key={tag}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold border tracking-wide ${cfg.color}`}
                              >
                                <Icon size={8} />
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Image placeholder */}
                    {(restaurant as typeof restaurant & { show_images?: boolean }).show_images && (
                      <button
                        onClick={() => openModal({ name: item.name, image: item.image, description: item.description })}
                        className="flex-shrink-0 w-20 h-20 rounded overflow-hidden flex items-center justify-center active:opacity-70 transition-opacity"
                        style={{ WebkitTapHighlightColor: "transparent", backgroundColor: `${primary}18` }}
                      >
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <span className="opacity-30 text-3xl">🍽</span>
                        }
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 inset-x-0 max-w-[500px] mx-auto z-20">
        <div
          className="py-2.5 text-center text-[10px] font-bold tracking-[0.15em] uppercase text-white/50"
          style={{ backgroundColor: primary }}
        >
          Powered by MagicMenu
        </div>
      </div>
    </div>
  );
}
