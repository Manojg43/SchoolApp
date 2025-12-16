'use client';

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext"; // New Import
import { useRouter } from "next/navigation"; // New Import
import { motion } from "framer-motion";
import { School, Users, FileText, Trophy } from "lucide-react";
import { Carousel } from "@/components/ui/Carousel";
import { useEffect, useState } from "react";
import { getAchievements, getDashboardStats, type Achievement } from "@/lib/api";

export default function Home() {
  const { t, setLanguage, language } = useLanguage();
  const { user, loading: authLoading } = useAuth(); // 1. Get Auth State
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({ students: 0, schools: 0 });
  const [dataLoading, setDataLoading] = useState(true);

  // 2. Protect Route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 3. Load Data only if User exists
  useEffect(() => {
    if (user) {
      async function loadData() {
        try {
          const [achData, statsData] = await Promise.all([
            getAchievements(),
            getDashboardStats()
          ]);
          setAchievements(achData);
          setStats(statsData);
        } catch (error) {
          console.error("Failed to load dashboard data", error);
        } finally {
          setDataLoading(false);
        }
      }
      loadData();
    }
  }, [user]);

  // 4. Show Loading State while checking auth
  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      {/* Navbar / Header would go here */}

      <main className="container mx-auto p-4 sm:p-8 flex flex-col gap-12">

        {/* Hero / Welcome Section */}
        <section className="flex flex-col gap-6 items-center sm:items-start">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex justify-between items-center"
          >
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">{t('title')}</h1>
              <p className="text-xl text-gray-600 mt-2">{t('welcome')}</p>
            </div>

            <div className="flex gap-2">
              {['en', 'hi', 'mr'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang as any)}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-all border ${language === lang
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Featured Achievements Carousel */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">School Achievements</h2>
          </div>
          {dataLoading ? (
            <div className="h-[400px] bg-gray-200 animate-pulse rounded-xl" />
          ) : achievements.length > 0 ? (
            <Carousel items={achievements as any} />
          ) : (
            <div className="h-[200px] border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
              No achievements found. Add some in Django Admin!
            </div>
          )}
        </section>

        {/* Stats / Dashboard Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <DashboardCard icon={<Users className="w-8 h-8" />} title={t('students')} value={stats.students} delay={0.1} />
          <DashboardCard icon={<School className="w-8 h-8" />} title={t('schools')} value={stats.schools} delay={0.2} />
          <DashboardCard icon={<FileText className="w-8 h-8" />} title={t('fee_invoice')} value="Latest #001" isInvoice delay={0.3} />
        </section>
      </main>
    </div>
  );
}

function DashboardCard({ icon, title, value, isInvoice = false, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
    >
      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h2>
        {isInvoice ? (
          <button className="text-blue-600 font-bold hover:underline mt-1">{value}</button>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        )}
      </div>
    </motion.div>
  );
}
