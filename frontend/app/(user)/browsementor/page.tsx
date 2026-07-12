"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPackagesAction, getCategories } from "@/lib/actions/mentor";
import { Search, UserX } from "lucide-react";
import PackageCard, { PackageItem } from "../../../components/PackageCard";

interface Category {
  _id: string;
  name: string;
}

export default function BrowseMentorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const activeCategory = searchParams.get("category") || "";

  useEffect(() => {
    const params: { search?: string; category?: string } = {};
    if (searchParams.get("search")) params.search = searchParams.get("search")!;
    if (searchParams.get("category")) params.category = searchParams.get("category")!;

    Promise.all([getPackagesAction(params), getCategories()]).then(([pkgRes, catRes]) => {
      if (pkgRes.success) setPackages(pkgRes.data || []);
      if (catRes.success) setCategories(catRes.data || []);
      setLoading(false);
    });
  }, [searchParams]);

  const goFilter = (next: { search?: string; category?: string }) => {
    const params = new URLSearchParams();
    const s = next.search !== undefined ? next.search : search;
    const c = next.category !== undefined ? next.category : activeCategory;
    if (s) params.set("search", s);
    if (c) params.set("category", c);
    router.push(`/browsementor?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
  <h1 className="text-2xl font-bold text-slate-900 mb-4">Browse Mentors</h1>
  <div className="relative max-w-md">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input value={search} onChange={e => setSearch(e.target.value)}
      onKeyDown={e => e.key === "Enter" && goFilter({ search })}
      placeholder="Search packages..."
      className="h-10 pl-9 pr-4 border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-full shadow-sm" />
  </div>
</div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: "none" }}>
        <button onClick={() => goFilter({ category: "" })}
          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
            !activeCategory ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}>
          All
        </button>
        {categories.map(c => (
          <button key={c._id} onClick={() => goFilter({ category: c._id })}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              activeCategory === c._id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}>
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-2 w-3/4" />
              <div className="h-4 bg-slate-200 rounded mb-4 w-1/2" />
              <div className="h-3 bg-slate-200 rounded mb-4 w-full" />
              <div className="h-9 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <UserX size={40} className="mx-auto mb-4" />
          <p>No packages found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map(p => (
            <PackageCard key={p._id} pkg={p} onClick={() => router.push(`/mentor-detail/${p.mentor?._id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}