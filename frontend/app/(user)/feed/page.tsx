"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { getPackagesAction, getCategories } from "@/lib/actions/mentor";
import { Search, Sparkles, ArrowRight, LayoutGrid } from "lucide-react";
import PackageCard, { PackageItem } from "../../../components/PackageCard";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const firstName = user?.fullname?.split(" ")[0] || "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    Promise.all([getPackagesAction(), getCategories()]).then(([pkgRes, catRes]) => {
      if (pkgRes.success) setPackages(pkgRes.data || []);
      if (catRes.success) setCategories(catRes.data || []);
      setLoading(false);
    });
  }, []);

  const goSearch = () => search.trim() && router.push(`/browsementor?search=${encodeURIComponent(search)}`);

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 md:px-16 pt-10 pb-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Sparkles size={12} /> {greeting}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome back, <span className="text-indigo-400">{firstName}</span></h1>
          <p className="text-slate-400 mb-6">Find the perfect mentor for your learning goals.</p>
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden max-w-xl">
            <Search size={16} className="absolute left-4 text-slate-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && goSearch()}
              placeholder="Search for a subject or mentor..."
              className="flex-1 pl-10 pr-28 h-14 bg-transparent border-0 text-slate-800 placeholder-slate-400 text-sm outline-none" />
            <button onClick={goSearch}
              className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 md:px-16 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-slate-900 text-lg font-bold">Browse Categories</h2><p className="text-slate-400 text-sm">What do you want to learn?</p></div>
            <button onClick={() => router.push("/browsementor")} className="text-indigo-600 text-sm font-semibold hover:underline flex items-center gap-1">See all <ArrowRight size={14} /></button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{scrollbarWidth:"none"}}>
            {categories.length === 0 && !loading && (
              <p className="text-slate-400 text-sm py-2">No categories yet.</p>
            )}
            {categories.map(c => (
              <button key={c._id} onClick={() => router.push(`/browsementor?category=${c._id}`)}
                className="flex flex-col items-center min-w-[80px] h-20 justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:ring-2 hover:ring-indigo-200 transition px-2">
                <LayoutGrid size={18} className="text-indigo-600" />
                <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="px-6 md:px-16 pt-8 pb-16">
        <div className="flex items-end justify-between mb-5">
          <div><h2 className="text-slate-900 text-xl font-bold">Latest Packages</h2><p className="text-slate-400 text-sm mt-0.5">Verified experts ready to help you grow</p></div>
          <button onClick={() => router.push("/browsementor")} className="text-indigo-600 text-sm font-semibold hover:underline flex items-center gap-1">See all <ArrowRight size={14} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {loading ? Array.from({length:4}).map((_,i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-4"><div className="w-9 h-9 bg-slate-200 rounded-full"/><div className="h-4 bg-slate-200 rounded w-1/2"/></div>
              <div className="h-4 bg-slate-200 rounded mb-2 w-3/4"/>
              <div className="h-3 bg-slate-200 rounded mb-4 w-full"/>
              <div className="h-9 bg-slate-200 rounded-xl"/>
            </div>
          )) : packages.length === 0
            ? <p className="col-span-4 text-center text-slate-400 py-10">No packages yet.</p>
            : packages.slice(0,8).map(p => <PackageCard key={p._id} pkg={p} onClick={() => router.push(`/mentor-detail/${p.mentor?._id}`)} />)
          }
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Available Now</span>
            <h3 className="font-bold text-xl mt-1">Ready to start learning today?</h3>
            <p className="text-slate-400 text-sm mt-1">Browse all verified mentors and book your first session.</p>
          </div>
          <button onClick={() => router.push("/browsementor")}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition whitespace-nowrap flex items-center gap-2">
            Explore All Mentors <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}