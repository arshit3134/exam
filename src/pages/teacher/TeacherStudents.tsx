import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, Award, Calendar, Search } from 'lucide-react';
import { teacherAPI } from '../../services/api';

interface StudentItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalAttempts: number;
  averagePercentage: number;
}

export const TeacherStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    teacherAPI
      .getStudents()
      .then((data) => setStudents(data))
      .catch((err) => console.error('Error fetching students:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Student Roster & Profiles</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Enrolled candidates, aggregate assessment attempts, and cumulative academic averages.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate by name..."
            className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading student directory...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-12 text-center text-xs text-zinc-400">
          No students matching search filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-zinc-700/80 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center font-bold text-xs text-emerald-300 shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{s.name}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono truncate">{s.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#27272A] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-400">Exams Taken</span>
                  <p className="font-mono tabular-nums font-semibold text-zinc-200 mt-0.5">
                    {s.totalAttempts} completed
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400">Cumulative Avg</span>
                  <p className="font-mono tabular-nums font-semibold text-purple-400 mt-0.5">
                    {s.averagePercentage}%
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>Joined: {new Date(s.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
