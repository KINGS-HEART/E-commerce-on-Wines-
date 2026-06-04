import React, { useEffect, useMemo, useState } from "react";

// Bejamas React single-file app
// - Default export: App component
// - Tailwind CSS is used for styling. If you don't use Tailwind, copy the original CSS
//   into your project's stylesheet and replace the classNames accordingly.

const PHOTOS = [
  { id: 1, title: "Samurai King Resting", category: "Pets", price: 0.0, src: "./images/pexels-evgeny-tchebotarev-2187304 (1) 1.png", bestSeller: false },
  { id: 2, title: "Red Bench", category: "People", price: 3.89, src: "./images/Group 40.png", bestSeller: true },
  { id: 3, title: "Egg Balloon", category: "Food", price: 93.89, src: "./images/Group 25.png" },
  { id: 4, title: "Egg Balloon 2", category: "Food", price: 93.89, src: "./images/Group 25 (1).png" },
  { id: 5, title: "Man", category: "People", price: 100.0, src: "./images/Group 26.png" },
  { id: 6, title: "Architecture", category: "Landmarks", price: 101.0, src: "./images/Group 48.png" },
  { id: 7, title: "Architecture 2", category: "Landmarks", price: 101.0, src: "./images/Group 8.png" },
  // Add more items if you want to test pagination
];

const CATEGORIES = ["People", "Premium", "Pets", "Food", "Landmarks", "Cities", "Nature"];
const PRICE_RANGES = [
  "Lower than $20",
  "$20 - $100",
  "$100 - $200",
  "More than $200",
];

function formatPrice(n) {
  return `$${n.toFixed(2)}`;
}

export default function App() {
  // UI state
  const [items] = useState(PHOTOS);
  const [categories, setCategories] = useState(new Set(["People", "Pets", "Food", "Landmarks"]));
  const [priceRanges, setPriceRanges] = useState(new Set());
  const [sort, setSort] = useState("none");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(6);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // cart persisted in localStorage
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem("bejamas_cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("bejamas_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Derived data: filtered, sorted, paginated
  const filtered = useMemo(() => {
    return items.filter((it) => {
      // category
      if (categories.size && !categories.has(it.category)) return false;
      // price ranges
      if (priceRanges.size) {
        let ok = false;
        const ranges = Array.from(priceRanges);
        for (const r of ranges) {
          const txt = r.toLowerCase();
          if (txt.includes("lower than")) {
            const m = r.match(/(\d+)/);
            if (m) { if (it.price < Number(m[1])) ok = true; }
            else ok = true;
          } else if (txt.includes("more than")) {
            const m = r.match(/(\d+)/);
            if (m) { if (it.price > Number(m[1])) ok = true; }
            else ok = true;
          } else {
            const between = r.match(/\$(\d+)\s*-\s*\$(\d+)/);
            if (between) {
              const min = Number(between[1]);
              const max = Number(between[2]);
              if (it.price >= min && it.price <= max) ok = true;
            }
          }
        }
        if (!ok) return false;
      }
      return true;
    });
  }, [items, categories, priceRanges]);

  const sorted = useMemo(() => {
    const copy = filtered.slice();
    if (sort === "price-asc") copy.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") copy.sort((a, b) => b.price - a.price);
    else if (sort === "newest") copy.sort((a, b) => b.id - a.id);
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return sorted.slice(start, start + perPage);
  }, [sorted, page, perPage]);

  // cart helpers
  const addToCart = (photo) => {
    setCart((c) => [...c, photo]);
  };
  const removeFromCart = (idx) => {
    setCart((c) => c.filter((_, i) => i !== idx));
  };
  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((s, it) => s + (Number(it.price) || 0), 0);

  // handlers
  const toggleCategory = (name) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setPage(1);
  };
  const togglePriceRange = (label) => {
    setPriceRanges((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
    setPage(1);
  };

  // responsive perPage: change when width changes (simple implementation)
  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 480) setPerPage(4);
      else if (window.innerWidth < 768) setPerPage(6);
      else setPerPage(6);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="header border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <img src="./images/Group.png" alt="Bejamas logo" className="h-8 object-contain" />
        <div className="relative">
          <img src="./images/Vector.png" alt="Shopping cart" className="h-6 object-contain cursor-pointer" onClick={() => setIsCartOpen(true)} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-2">{cart.length}</span>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="hero-section border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-0">
            <h1 className="text-3xl md:text-4xl font-bold">Samurai King Resting</h1>
            <button className="btn bg-black text-white uppercase text-sm px-4 py-2 rounded" onClick={() => {
              // default hero add-to-cart takes first photo
              if (items[0]) addToCart(items[0]);
            }}>Add to Cart</button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <img src={items[0].src} alt={items[0].title} className="w-full h-64 md:h-96 object-cover rounded" />
              <span className="absolute left-2 bottom-6 bg-white font-bold px-3 py-1">Photo of the day</span>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold">About the Samurai King Resting</h3>
                <span className="text-sm font-semibold text-gray-600">Pets</span>
                <p className="text-gray-600 mt-3">So how did the classical Latin become so incoherent? According to McClintock, a 15th century typesetter likely scrambled part of Cicero's De Finibus in order to provide placeholder text to mockup various fonts for a type specimen book. So how did the classical Latin become so incoherent? According to McClintock, a 15th century typesetter likely scrambled part of Cicero's De Finibus in order to provide placeholder.</p>
              </div>

              <aside className="bg-white p-4 border rounded">
                <h3 className="text-lg font-bold text-right">People also buy</h3>
                <div className="flex gap-2 mt-3 justify-end">
                  <img src="./images/Rectangle 10.png" alt="Camera" className="w-12 h-12 object-cover" />
                  <img src="./images/Rectangle 10.1.png" alt="Frame" className="w-12 h-12 object-cover" />
                  <img src="./images/Rectangle 10.2.png" alt="Print" className="w-12 h-12 object-cover" />
                </div>
                <div className="mt-4 text-right">
                  <h4 className="font-bold">Details</h4>
                  <p className="text-sm text-gray-500"><strong>Size:</strong> 1020 x 1020 pixel</p>
                  <p className="text-sm text-gray-500"><strong>File size:</strong> 15 MB</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className={`sidebar w-56 ${isSidebarOpen ? "fixed left-0 top-0 h-full z-40 bg-white p-4 shadow-lg transform translate-x-0" : "hidden md:block"}`}>
          <h3 className="text-xl font-bold">Category</h3>
          <ul className="mt-4 space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={categories.has(c)} onChange={() => toggleCategory(c)} />
                  <span>{c}</span>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <h4 className="font-semibold">Price range</h4>
            <div className="mt-2 space-y-2 text-sm">
              {PRICE_RANGES.map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={priceRanges.has(r)} onChange={() => togglePriceRange(r)} />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Gallery */}
        <main className="flex-1">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Photography / <span className="text-gray-500 font-normal">Premium Photos</span></h2>
            </div>

            <div className="flex items-center gap-3">
              <button className="md:hidden px-3 py-2 border rounded" onClick={() => setIsSidebarOpen(true)}>Filters</button>
              <select className="border px-2 py-1" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                <option value="none">↕ Sort By Price</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((p) => (
              <article className="photo-item bg-white border rounded overflow-hidden relative" key={p.id}>
                {p.bestSeller && <span className="absolute top-2 left-2 bg-white px-3 py-1 text-sm font-bold">Best Seller</span>}
                <img src={p.src} alt={p.title} className="w-full h-40 object-cover" />
                <div className="p-3">
                  <span className="text-sm font-bold text-gray-600">{p.category}</span>
                  <h3 className="text-base font-semibold mt-1">{p.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{formatPrice(p.price)}</p>
                  <button className="mt-3 w-full bg-black text-white uppercase text-xs py-2 rounded" onClick={() => addToCart(p)}>Add to Cart</button>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button className="px-3 py-1 border rounded" onClick={() => setPage((s) => Math.max(1, s - 1))}>‹</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={`w-9 h-9 rounded ${page === i + 1 ? "bg-black text-white" : "border"}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="px-3 py-1 border rounded" onClick={() => setPage((s) => Math.min(totalPages, s + 1))}>›</button>
          </div>
        </main>
      </div>

      {/* Cart Backdrop */}
      {(isSidebarOpen || isCartOpen) && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setIsSidebarOpen(false); setIsCartOpen(false); }} />}

      {/* Cart Panel */}
      <aside className={`fixed top-0 right-0 h-full bg-white w-full md:w-96 z-50 transform ${isCartOpen ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold">Your Cart</h3>
          <button className="text-2xl" onClick={() => setIsCartOpen(false)}>×</button>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          {cart.length === 0 && <div className="text-gray-500">Your cart is empty</div>}
          <div className="space-y-3">
            {cart.map((it, idx) => (
              <div key={idx} className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
                <img src={it.src} alt={it.title} className="w-12 h-12 object-cover border" />
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-sm text-gray-500">{formatPrice(it.price)}</div>
                </div>
                <button className="text-red-600 text-sm" onClick={() => removeFromCart(idx)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold">{formatPrice(cartTotal)}</span>
          </div>
          <button className="w-full bg-black text-white py-2 rounded" onClick={clearCart}>Clear</button>
        </div>
      </aside>
    </div>
  );
}
