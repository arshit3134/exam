import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  FileCheck2,
  CheckCircle2,
  BarChart2,
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowUpRight,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { StatCard } from '../../components/common/StatCard';
import { teacherAPI } from '../../services/api';
import { DifficultQuestion, TeacherStats } from '../../types';

export const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [difficultQuestions, setDifficultQuestions] = useState<DifficultQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [s, a, d] = await Promise.all([
        teacherAPI.getDashboardStats(),
        teacherAPI.getAnalytics(),
        teacherAPI.getDifficultQuestions(),
      ]);
      setStats(s);
      setAnalytics(a);
      setDifficultQuestions(d);
    } catch (err) {
      console.error('Failed to load teacher analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const PIE_COLORS = ['#22C55E', '#EF4444'];

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#27272A]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Faculty Analytics Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time student attempt evaluation, cohort score distribution, and question difficulty rankings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-zinc-800 border border-[#27272A] rounded-lg text-xs text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
          <NavLink
            to="/teacher/exams/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            + Create New Exam
          </NavLink>
        </div>
      </div>

      {/* 7 Key Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          label="Total Students"
          value={stats?.totalStudents ?? 0}
          unit="candidates"
          icon={Users}
        />
        <StatCard
          label="Exams Created"
          value={stats?.totalExams ?? 0}
          unit="assessments"
          icon={FileCheck2}
        />
        <StatCard
          label="Total Attempts"
          value={stats?.totalAttempts ?? 0}
          unit="submissions"
          icon={TrendingUp}
        />
        <StatCard
          label="Avg Marks"
          value={stats?.overallAverageMarks ?? 0}
          unit="pts"
          icon={BarChart2}
        />
        <StatCard
          label="Highest Score"
          value={stats?.highestScore ?? 0}
          unit="pts"
          icon={Award}
        />
        <StatCard
          label="Lowest Score"
          value={stats?.lowestScore ?? 0}
          unit="pts"
          icon={AlertTriangle}
        />
        <StatCard
          label="Pass Rate"
          value={`${stats?.averagePassPercentage ?? 0}%`}
          subtext="Cohort average"
          icon={CheckCircle2}
        />
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Average Marks Across Exams */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Average Marks Across Exams</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Mean performance score by examination</p>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">Actual Mongo Records</span>
          </div>
          <div className="h-64 w-full">
            {analytics?.examAverages && analytics.examAverages.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.examAverages} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="examTitle" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#FAFAFA' }}
                  />
                  <Bar dataKey="averageMarks" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No attempt records available yet.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Score Distribution */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Score Distribution</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Candidate counts by score percentage bracket</p>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">Cohort Spread</span>
          </div>
          <div className="h-64 w-full">
            {analytics?.distribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="range" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#FAFAFA' }}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 3: Pass vs Fail Percentage */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Overall Pass vs Fail Ratio</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Percentage of attempts passing threshold</p>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">Cohort Summary</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {analytics?.passVsFail ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.passVsFail}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {analytics.passVsFail.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    formatter={(value, entry: any) => (
                      <span className="text-xs text-zinc-300 font-medium">
                        {value} ({entry.payload.percentage}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 4: Exam-Wise Performance Breakdown */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Exam-Wise Student Outcomes</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Passed vs Failed count per examination</p>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">Comparative</span>
          </div>
          <div className="h-64 w-full">
            {analytics?.examPassFail ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.examPassFail} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="examTitle" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="passed" stackId="a" fill="#22C55E" name="Passed" />
                  <Bar dataKey="failed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* SECTION: MOST DIFFICULT QUESTIONS */}
      {/* Prominently requested: Question text, Exam name, Total attempts, Incorrect count, % incorrect, Correct answer */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-[#27272A]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <h2 className="text-base font-bold text-white">Most Difficult Questions</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Ranked by student failure rate across all submitted attempts. Enables faculty to pinpoint curriculum concepts that need reinforcement.
            </p>
          </div>
          <NavLink
            to="/teacher/difficult-questions"
            className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
          >
            <span>View Full Diagnostic</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {difficultQuestions.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No question attempt statistics available yet. Once students take exams, failure rates will display here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272A] text-zinc-400 font-medium">
                  <th className="py-3 px-3">Question</th>
                  <th className="py-3 px-3">Exam Name</th>
                  <th className="py-3 px-3 text-right">Attempts</th>
                  <th className="py-3 px-3 text-right">Incorrect</th>
                  <th className="py-3 px-3 text-right">Failure Rate</th>
                  <th className="py-3 px-3">Correct Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/60">
                {difficultQuestions.slice(0, 6).map((q) => (
                  <tr key={q.questionId} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-3 max-w-sm text-zinc-200 font-medium leading-relaxed">
                      {q.questionText}
                    </td>
                    <td className="py-3.5 px-3 text-zinc-400 whitespace-nowrap">
                      {q.examTitle}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-zinc-300">
                      {q.totalAttempts}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-rose-400 font-semibold">
                      {q.incorrectAnswers}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${Math.min(100, q.failurePercentage)}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums text-rose-300 font-semibold w-11 text-right">
                          {q.failurePercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-zinc-300 font-mono text-[11px] max-w-xs truncate">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-semibold mr-1.5">
                        {q.correctOption}
                      </span>
                      <span>{q.correctOptionText.replace(/^[A-D]:\s*/, '')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
