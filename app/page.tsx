'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle,
  UserCheck,
  Check,
  X,
  MapPin,
  Building2,
  Hand,
} from 'lucide-react';

// --- TIPI E COSTANTI ---

type Role = 'admin' | 'team_leader' | 'member';
type UserStatus = 'approved' | 'pending';
type Area = 'Chiesa' | 'Rhema' | 'Arcer';
type EventStatus = 'active' | 'rescheduled' | 'suspended';

interface User {
  id: string;
  name: string;
  email: string;
  pass: string;
  role: Role;
  team: string;
  status: UserStatus;
}

interface ChurchEvent {
  id: string;
  title: string;
  location: Area;
  date?: string;
  startTime: string;
  endTime: string;
  recurrence: 'none' | 'weekly';
  dayOfWeek?: number | null;
  isFixed?: boolean;
  status: EventStatus;
  notes?: string;
}

interface AvailabilityRecord {
  userId: string;
  userName: string;
  team: string;
  date: string;
  status: 'available' | 'maybe' | 'unavailable';
  note?: string;
}

interface DutyRecord {
  id: string;
  team: string;
  date: string;
  memberName: string;
}

const TEAMS = [
  'Team worship',
  'Team production',
  'Team accoglienza',
  'Team santa cena',
  'Team ora felice',
  'Team bar',
  'Team comunicazione',
  'Team cellule',
  'Team giovani',
  'Team formazione',
  'Team evangelizzazione',
  'Team cuori generosi',
  'Team infrastrutture',
  'Team intercessione',
  'Team finanza',
  'Team pastorale',
];

const MASTER_ADMIN: User = {
  id: 'admin-master',
  name: 'Amministratore Pastore',
  email: 'admin@chiesacaserta.it',
  pass: 'admin123',
  role: 'admin',
  team: 'Team pastorale',
  status: 'approved',
};

const INITIAL_EVENTS: ChurchEvent[] = [
  {
    id: 'culto-domenica',
    title: 'Culto Domenicale',
    location: 'Chiesa',
    startTime: '10:00',
    endTime: '12:00',
    recurrence: 'weekly',
    dayOfWeek: 0,
    isFixed: true,
    status: 'active',
    notes: 'Incontro comunitario principale',
  },
  {
    id: 'preghiera-venerdi',
    title: 'Incontro di Preghiera',
    location: 'Rhema',
    startTime: '19:00',
    endTime: '20:00',
    recurrence: 'weekly',
    dayOfWeek: 5,
    isFixed: true,
    status: 'active',
    notes: 'Intercessione e lode',
  },
];

const springSnappy = { type: 'spring', stiffness: 420, damping: 30 } as const;
const springSmooth = { type: 'spring', stiffness: 280, damping: 26 } as const;

export default function Page() {
  const [users, setUsers] = useState<User[]>([MASTER_ADMIN]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<ChurchEvent[]>(INITIAL_EVENTS);
  const [eventExceptions, setEventExceptions] = useState<
    Record<string, Partial<ChurchEvent>>
  >({});
  const [availabilityRecords, setAvailabilityRecords] = useState<
    Record<string, AvailabilityRecord>
  >({});
  const [duties, setDuties] = useState<DutyRecord[]>([]);

  const [currentView, setCurrentView] = useState<
    'home' | 'calendar' | 'teams' | 'availability'
  >('home');
  const [currentAreaFilter, setCurrentAreaFilter] = useState<'all' | Area>(
    'all'
  );
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regTeam, setRegTeam] = useState(TEAMS[0]);
  const [regIsLeader, setRegIsLeader] = useState(false);

  const [eventFormState, setEventFormState] = useState({
    id: '',
    title: '',
    location: 'Chiesa' as Area,
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '19:30',
    recurrence: 'none' as 'none' | 'weekly',
    status: 'active' as EventStatus,
    notes: '',
  });

  const [selectedAvailDate, setSelectedAvailDate] = useState('');
  const [selectedAvailStatus, setSelectedAvailStatus] = useState<
    'available' | 'maybe' | 'unavailable'
  >('available');
  const [availNote, setAvailNote] = useState('');

  const [selectedTeamView, setSelectedTeamView] = useState(TEAMS[0]);
  const [dutyAssignDate, setDutyAssignDate] = useState('');
  const [dutyAssignMember, setDutyAssignMember] = useState('');

  useEffect(() => {
    try {
      const u = localStorage.getItem('ccc_app_users');
      if (u) setUsers(JSON.parse(u));
      const c = localStorage.getItem('ccc_app_curr');
      if (c) setCurrentUser(JSON.parse(c));
      const e = localStorage.getItem('ccc_app_events');
      if (e) setEvents(JSON.parse(e));
      const ex = localStorage.getItem('ccc_app_exc');
      if (ex) setEventExceptions(JSON.parse(ex));
      const a = localStorage.getItem('ccc_app_avail');
      if (a) setAvailabilityRecords(JSON.parse(a));
      const d = localStorage.getItem('ccc_app_duties');
      if (d) setDuties(JSON.parse(d));
    } catch {}
  }, []);

  const saveStateToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const nextServiceDates = useMemo(() => {
    const dates: Date[] = [];
    const d = new Date();
    while (dates.length < 8) {
      if (d.getDay() === 0 || d.getDay() === 5) {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }, []);

  useEffect(() => {
    if (nextServiceDates.length > 0 && !selectedAvailDate) {
      const firstIso = nextServiceDates[0].toISOString().split('T')[0];
      setSelectedAvailDate(firstIso);
      setDutyAssignDate(firstIso);
    }
  }, [nextServiceDates, selectedAvailDate]);

  const isAdmin = currentUser?.role === 'admin';
  const isLeader =
    currentUser?.role === 'team_leader' && currentUser?.status === 'approved';
  const isMember =
    !!currentUser && (currentUser.role === 'member' || isLeader || isAdmin);
  const pendingRequests = users.filter((u) => u.status === 'pending');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
        u.pass === loginPass
    );
    if (found) {
      setCurrentUser(found);
      saveStateToStorage('ccc_app_curr', found);
      setLoginError(false);
      setShowAuthModal(false);
    } else {
      setLoginError(true);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      users.some((u) => u.email.toLowerCase() === regEmail.trim().toLowerCase())
    ) {
      alert('Email già registrata.');
      return;
    }
    const newUser: User = {
      id: 'u_' + Date.now(),
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      pass: regPass,
      team: regTeam,
      role: regIsLeader ? 'team_leader' : 'member',
      status: regIsLeader ? 'pending' : 'approved',
    };

    const updated = [...users, newUser];
    setUsers(updated);
    setCurrentUser(newUser);
    saveStateToStorage('ccc_app_users', updated);
    saveStateToStorage('ccc_app_curr', newUser);
    setShowAuthModal(false);
    setCurrentView('availability');
  };

  const emergencyAdminBypass = () => {
    let master = users.find((u) => u.role === 'admin');
    if (!master) {
      master = MASTER_ADMIN;
      setUsers((prev) => [...prev, master!]);
    }
    setCurrentUser(master);
    saveStateToStorage('ccc_app_curr', master);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ccc_app_curr');
    setCurrentView('home');
  };

  const getEventsForDate = (dateStr: string) => {
    const targetDate = new Date(dateStr + 'T00:00:00');
    const targetDay = targetDate.getDay();
    const res: ChurchEvent[] = [];

    events.forEach((ev) => {
      const applies =
        (ev.recurrence === 'weekly' && ev.dayOfWeek === targetDay) ||
        (ev.recurrence === 'none' && ev.date === dateStr);

      if (applies) {
        const exc = eventExceptions[`${ev.id}_${dateStr}`];
        res.push(
          exc ? { ...ev, ...exc, date: dateStr } : { ...ev, date: dateStr }
        );
      }
    });

    return res.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const {
      id,
      title,
      location,
      date,
      startTime,
      endTime,
      recurrence,
      status,
      notes,
    } = eventFormState;

    if (status !== 'suspended') {
      const dayEvents = getEventsForDate(date).filter(
        (ev) =>
          ev.id !== id && ev.location === location && ev.status !== 'suspended'
      );
      const collision = dayEvents.some(
        (ev) => startTime < ev.endTime && endTime > ev.startTime
      );
      if (collision) {
        alert(
          `ATTENZIONE: La sala "${location}" è già occupata in questa fascia oraria.`
        );
        return;
      }
    }

    if (id) {
      const existing = events.find((ev) => ev.id === id);
      if (existing && existing.recurrence === 'weekly') {
        const nextExc = {
          ...eventExceptions,
          [`${id}_${date}`]: { location, startTime, endTime, status, notes },
        };
        setEventExceptions(nextExc);
        saveStateToStorage('ccc_app_exc', nextExc);
      } else if (existing) {
        const nextEvts = events.map((ev) =>
          ev.id === id
            ? {
                ...ev,
                title,
                location,
                date,
                startTime,
                endTime,
                status,
                notes,
              }
            : ev
        );
        setEvents(nextEvts);
        saveStateToStorage('ccc_app_events', nextEvts);
      }
    } else {
      const dObj = new Date(date + 'T00:00:00');
      const newEvt: ChurchEvent = {
        id: 'ev_' + Date.now(),
        title,
        location,
        date,
        startTime,
        endTime,
        recurrence,
        dayOfWeek: recurrence === 'weekly' ? dObj.getDay() : null,
        isFixed: false,
        status,
        notes,
      };
      const nextEvts = [...events, newEvt];
      setEvents(nextEvts);
      saveStateToStorage('ccc_app_events', nextEvts);
    }

    setShowEventForm(false);
  };

  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedAvailDate) return;

    const key = `${currentUser.id}_${selectedAvailDate}`;
    const nextAvail = {
      ...availabilityRecords,
      [key]: {
        userId: currentUser.id,
        userName: currentUser.name,
        team: currentUser.team,
        date: selectedAvailDate,
        status: selectedAvailStatus,
        note: availNote.trim(),
      },
    };
    setAvailabilityRecords(nextAvail);
    saveStateToStorage('ccc_app_avail', nextAvail);
    setAvailNote('');
    alert('Disponibilità registrata con successo!');
  };

  const handleAssignDuty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyAssignMember || !dutyAssignDate) return;

    const newDuty: DutyRecord = {
      id: 'd_' + Date.now(),
      team: selectedTeamView,
      date: dutyAssignDate,
      memberName: dutyAssignMember,
    };
    const nextDuties = [...duties, newDuty];
    setDuties(nextDuties);
    saveStateToStorage('ccc_app_duties', nextDuties);
  };

  const removeDuty = (id: string) => {
    const nextDuties = duties.filter((d) => d.id !== id);
    setDuties(nextDuties);
    saveStateToStorage('ccc_app_duties', nextDuties);
  };

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysInPrev = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ day: daysInPrev - i, isOutside: true, dateStr: '' });
    }

    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === d;
      cells.push({ day: d, isOutside: false, dateStr, isToday });
    }

    const rem = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= rem; d++) {
      cells.push({ day: d, isOutside: true, dateStr: '' });
    }

    return cells;
  }, [viewDate]);

  return (
    <div className="min-h-screen bg-slate-50 text-[#2B6B55] font-sans antialiased selection:bg-[#CFE6CC] selection:text-[#2B6B55]">
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(45,139,111,0.12),transparent_65%)]" />

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#CFE6CC] bg-white/90 backdrop-blur-md shadow-[0_1px_2px_rgba(43,107,85,0.04)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setCurrentView('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#2D8B6F] flex items-center justify-center font-bold text-white shadow-md shadow-[#2D8B6F]/20">
              CCC
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#2B6B55] tracking-tight leading-none">
                Comunità Cristiana Caserta
              </h1>
              <span className="text-[11px] font-mono text-[#8AAE9E] mt-1 block">
                Chiesa · Sala Rhema · Sala Arcer
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 bg-[#DCEFDA]/60 border border-[#CFE6CC] p-1 rounded-xl">
            {(['home', 'calendar'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setCurrentView(v)}
                className={`relative px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentView === v
                    ? 'text-white'
                    : 'text-[#2B6B55] hover:text-[#2D8B6F]'
                }`}
              >
                {currentView === v && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    transition={springSnappy}
                    className="absolute inset-0 bg-[#2D8B6F] rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">
                  {v === 'home' ? 'Home' : 'Calendario Aree'}
                </span>
              </button>
            ))}

            {(isAdmin || isLeader) && (
              <button
                onClick={() => setCurrentView('teams')}
                className={`relative px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentView === 'teams'
                    ? 'text-white'
                    : 'text-[#2B6B55] hover:text-[#2D8B6F]'
                }`}
              >
                {currentView === 'teams' && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    transition={springSnappy}
                    className="absolute inset-0 bg-[#2D8B6F] rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">Squadre & Turni</span>
              </button>
            )}

            {isMember && (
              <button
                onClick={() => setCurrentView('availability')}
                className={`relative px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentView === 'availability'
                    ? 'text-white'
                    : 'text-[#2B6B55] hover:text-[#2D8B6F]'
                }`}
              >
                {currentView === 'availability' && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    transition={springSnappy}
                    className="absolute inset-0 bg-[#2D8B6F] rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">Mie Disponibilità</span>
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-800 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Richieste Leader ({pendingRequests.length})</span>
              </motion.button>
            )}

            {!currentUser ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#2D8B6F] text-white shadow-sm hover:bg-[#2B6B55] transition-colors"
              >
                Accedi / Registrati
              </motion.button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-medium text-[#2B6B55]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-[#8AAE9E]">
                    {currentUser.team}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-white border border-[#CFE6CC] text-[#8AAE9E] hover:text-rose-600 transition-colors shadow-xs"
                  title="Disconnetti"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTENUTO */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence>
          {showAdminPanel && isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 bg-white border border-amber-300 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <Shield className="w-4 h-4" />
                  Approvazione Nomine Team Leader
                </div>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="text-xs text-[#8AAE9E] hover:text-[#2B6B55]"
                >
                  ✕ Chiudi
                </button>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-xs text-[#8AAE9E]">
                  Nessuna richiesta di nomina in attesa.
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#DCEFDA]/30 border border-[#CFE6CC]"
                    >
                      <div>
                        <div className="text-xs font-medium text-[#2B6B55]">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-[#8AAE9E]">
                          {u.email} ·{' '}
                          <span className="font-semibold text-[#2D8B6F]">
                            {u.team}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const updated = users.map((x) =>
                              x.id === u.id
                                ? { ...x, status: 'approved' as UserStatus }
                                : x
                            );
                            setUsers(updated);
                            saveStateToStorage('ccc_app_users', updated);
                          }}
                          className="px-3 py-1 rounded-lg text-xs bg-[#DCEFDA] text-[#2B6B55] border border-[#CFE6CC] hover:bg-[#CFE6CC] font-medium transition-colors"
                        >
                          Approva
                        </button>
                        <button
                          onClick={() => {
                            const updated = users.map((x) =>
                              x.id === u.id
                                ? {
                                    ...x,
                                    role: 'member' as Role,
                                    status: 'approved' as UserStatus,
                                  }
                                : x
                            );
                            setUsers(updated);
                            saveStateToStorage('ccc_app_users', updated);
                          }}
                          className="px-3 py-1 rounded-lg text-xs bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-medium transition-colors"
                        >
                          Rifiuta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEventForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                transition={springSnappy}
                className="w-full max-w-lg bg-white border border-[#CFE6CC] rounded-2xl p-6 shadow-xl"
              >
                <div className="flex justify-between items-center pb-4 border-b border-[#CFE6CC] mb-4">
                  <h3 className="text-sm font-semibold text-[#2B6B55]">
                    {eventFormState.id
                      ? 'Modifica Attività'
                      : 'Programma Nuova Attività'}
                  </h3>
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="text-[#8AAE9E] hover:text-[#2B6B55]"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
                  <div>
                    <label className="block uppercase font-mono text-[10px] text-[#8AAE9E] mb-1">
                      Nome Attività
                    </label>
                    <input
                      type="text"
                      required
                      value={eventFormState.title}
                      onChange={(e) =>
                        setEventFormState({
                          ...eventFormState,
                          title: e.target.value,
                        })
                      }
                      placeholder="es. Prove Team Worship..."
                      className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F] focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase font-mono text-[10px] text-[#8AAE9E] mb-1">
                        Area / Sala
                      </label>
                      <select
                        value={eventFormState.location}
                        onChange={(e) =>
                          setEventFormState({
                            ...eventFormState,
                            location: e.target.value as Area,
                          })
                        }
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F] focus:bg-white transition-colors"
                      >
                        <option value="Chiesa">Chiesa</option>
                        <option value="Rhema">Rhema</option>
                        <option value="Arcer">Arcer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block uppercase font-mono text-[10px] text-[#8AAE9E] mb-1">
                        Data
                      </label>
                      <input
                        type="date"
                        required
                        value={eventFormState.date}
                        onChange={(e) =>
                          setEventFormState({
                            ...eventFormState,
                            date: e.target.value,
                          })
                        }
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F] focus:bg-white transition-colors"
                      ></input>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase font-mono text-[10px] text-[#8AAE9E] mb-1">
                        Ora Inizio
                      </label>
                      <input
                        type="time"
                        required
                        value={eventFormState.startTime}
                        onChange={(e) =>
                          setEventFormState({
                            ...eventFormState,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F] focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block uppercase font-mono text-[10px] text-[#8AAE9E] mb-1">
                        Ora Fine
                      </label>
                      <input
                        type="time"
                        required
                        value={eventFormState.endTime}
                        onChange={(e) =>
                          setEventFormState({
                            ...eventFormState,
                            endTime: e.target.value,
                          })
                        }
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase font-mono text-[10px] text-[#8AAE9E] mb-1">
                        Cadenza
                      </label>
                      <select
                        value={eventFormState.recurrence}
                        onChange={(e) =>
                          setEventFormState({
                            ...eventFormState,
                            recurrence: e.target.value as 'none' | 'weekly',
                          })
                        }
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F]"
                      >
                        <option value="none">Singolo Incontro</option>
                        <option value="weekly">Settimanale</option>
                      </select>
                    </div>
                    <div>
                      <label className="block uppercase font-mono text-[10px] text-[#8AAE9E] mb-1">
                        Stato Incontro
                      </label>
                      <select
                        value={eventFormState.status}
                        onChange={(e) =>
                          setEventFormState({
                            ...eventFormState,
                            status: e.target.value as EventStatus,
                          })
                        }
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F]"
                      >
                        <option value="active">Confermato</option>
                        <option value="rescheduled">Rischedulato</option>
                        <option value="suspended">Sospeso</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase font-mono text-[10px] text-[#8AAE9E] mb-1">
                      Note
                    </label>
                    <textarea
                      rows={2}
                      value={eventFormState.notes}
                      onChange={(e) =>
                        setEventFormState({
                          ...eventFormState,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Dettagli aggiuntivi per la comunità..."
                      className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="px-4 py-2 rounded-lg bg-[#DCEFDA] text-[#2B6B55] hover:bg-[#CFE6CC] font-medium transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#2D8B6F] text-white font-medium hover:bg-[#2B6B55] shadow-xs transition-colors"
                    >
                      Salva Attività
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAuthModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="w-full max-w-sm bg-white border border-[#CFE6CC] rounded-2xl p-6 shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-semibold text-[#2B6B55]">
                    {authTab === 'login'
                      ? 'Accesso al Portale'
                      : 'Nuova Registrazione'}
                  </div>
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="text-[#8AAE9E] hover:text-[#2B6B55]"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex bg-[#DCEFDA]/60 p-1 rounded-xl mb-4 border border-[#CFE6CC]">
                  <button
                    onClick={() => setAuthTab('login')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      authTab === 'login'
                        ? 'bg-[#2D8B6F] text-white shadow-xs'
                        : 'text-[#2B6B55]'
                    }`}
                  >
                    Accedi
                  </button>
                  <button
                    onClick={() => setAuthTab('register')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      authTab === 'register'
                        ? 'bg-[#2D8B6F] text-white shadow-xs'
                        : 'text-[#2B6B55]'
                    }`}
                  >
                    Registrati
                  </button>
                </div>

                {authTab === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="esempio@email.it"
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F]"
                      />
                    </div>
                    {loginError && (
                      <p className="text-xs text-rose-600">
                        Credenziali errate.
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#2D8B6F] hover:bg-[#2B6B55] text-white font-medium rounded-lg mt-2 shadow-xs transition-colors"
                    >
                      Entra nel Portale
                    </button>

                    <div className="pt-3 border-t border-[#CFE6CC] text-center">
                      <button
                        type="button"
                        onClick={emergencyAdminBypass}
                        className="text-xs text-amber-700 hover:text-amber-800 underline"
                      >
                        🚨 Bypass Emergenza Amministratore
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                        Nome e Cognome
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Mario Rossi"
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="mario@email.it"
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                        Seleziona Team
                      </label>
                      <select
                        value={regTeam}
                        onChange={(e) => setRegTeam(e.target.value)}
                        className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-lg px-3 py-2 text-[#2B6B55] outline-none focus:border-[#2D8B6F]"
                      >
                        {TEAMS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="regLeader"
                        checked={regIsLeader}
                        onChange={(e) => setRegIsLeader(e.target.checked)}
                        className="rounded accent-[#2D8B6F]"
                      />
                      <label htmlFor="regLeader" className="text-[#2B6B55]">
                        Richiedi ruolo di Team Leader
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#2D8B6F] hover:bg-[#2B6B55] text-white font-medium rounded-lg mt-2 shadow-xs transition-colors"
                    >
                      Completa Registrazione
                    </button>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VISTA 1: HOME */}
        {currentView === 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springSmooth}
            className="space-y-8"
          >
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#DCEFDA] via-white to-[#CFE6CC]/40 border border-[#CFE6CC] relative overflow-hidden shadow-xs">
              <div className="max-w-2xl relative z-10">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#2D8B6F] font-semibold block mb-2">
                  Portale Gestionale di Comunità
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-[#2B6B55] mb-2">
                  Benvenuto nel Portale CCC
                </h2>
                <p className="text-xs text-[#2B6B55]/85 leading-relaxed">
                  Gestione integrata per le 3 sale (Chiesa, Rhema, Arcer) e
                  coordinamento dei servizi e delle turnazioni per i 16 team
                  ministeriali.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentView('calendar')}
                className="group cursor-pointer p-6 rounded-2xl bg-white border border-[#CFE6CC] hover:border-[#2D8B6F] shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#DCEFDA] border border-[#CFE6CC] text-[#2D8B6F] flex items-center justify-center mb-4">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[#2B6B55] group-hover:text-[#2D8B6F] transition-colors">
                    Calendario Attività & Sale
                  </h3>
                  <p className="text-xs text-[#8AAE9E] mt-2 leading-relaxed">
                    Controlla l'occupazione in tempo reale di Chiesa, Rhema e
                    Arcer. Visualizza gli orari di tutti i culti e le prove.
                  </p>
                </div>
                <div className="mt-6 text-xs font-semibold text-[#2D8B6F] flex items-center gap-1">
                  Apri Calendario →
                </div>
              </motion.div>

              {(isAdmin || isLeader) && (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentView('teams')}
                  className="group cursor-pointer p-6 rounded-2xl bg-white border border-[#CFE6CC] hover:border-[#2D8B6F] shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#DCEFDA] border border-[#CFE6CC] text-[#2D8B6F] flex items-center justify-center mb-4">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-[#2B6B55] group-hover:text-[#2D8B6F] transition-colors">
                      Squadre & Turni
                    </h3>
                    <p className="text-xs text-[#8AAE9E] mt-2 leading-relaxed">
                      Riservato ai Team Leader: incrocia le presenze fornite dai
                      membri del tuo team e assegna le rotazioni di servizio.
                    </p>
                  </div>
                  <div className="mt-6 text-xs font-semibold text-[#2D8B6F] flex items-center gap-1">
                    Gestisci Squadra →
                  </div>
                </motion.div>
              )}

              {isMember ? (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentView('availability')}
                  className="group cursor-pointer p-6 rounded-2xl bg-white border border-[#CFE6CC] hover:border-[#2D8B6F] shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#DCEFDA] border border-[#CFE6CC] text-[#2D8B6F] flex items-center justify-center mb-4">
                      <Hand className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-[#2B6B55] group-hover:text-[#2D8B6F] transition-colors">
                      Le Mie Disponibilità
                    </h3>
                    <p className="text-xs text-[#8AAE9E] mt-2 leading-relaxed">
                      Comunica con anticipo le date in cui puoi servire durante
                      i culti domenicali o gli incontri infrasettimanali.
                    </p>
                  </div>
                  <div className="mt-6 text-xs font-semibold text-[#2D8B6F] flex items-center gap-1">
                    Comunica Presenze →
                  </div>
                </motion.div>
              ) : (
                <div
                  onClick={() => setShowAuthModal(true)}
                  className="cursor-pointer p-6 rounded-2xl bg-white/60 border border-dashed border-[#CFE6CC] hover:border-[#2D8B6F] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#DCEFDA] text-[#2D8B6F] flex items-center justify-center mb-4">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-[#2B6B55]">
                      Fai parte di una Squadra?
                    </h3>
                    <p className="text-xs text-[#8AAE9E] mt-2 leading-relaxed">
                      Accedi o registrati per sbloccare la gestione delle
                      disponibilità e visualizzare i turni del tuo team.
                    </p>
                  </div>
                  <div className="mt-6 text-xs font-semibold text-[#2D8B6F]">
                    Accedi o Registrati →
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VISTA 2: CALENDARIO */}
        {currentView === 'calendar' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springSmooth}
            className="space-y-6"
          >
            <div className="bg-white border border-[#CFE6CC] rounded-3xl p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#CFE6CC]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setViewDate(
                        new Date(
                          viewDate.getFullYear(),
                          viewDate.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="p-2 rounded-xl bg-[#DCEFDA] border border-[#CFE6CC] hover:bg-[#CFE6CC] text-[#2B6B55] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-base font-semibold capitalize min-w-[150px] text-center text-[#2B6B55]">
                    {viewDate.toLocaleDateString('it-IT', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    onClick={() =>
                      setViewDate(
                        new Date(
                          viewDate.getFullYear(),
                          viewDate.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="p-2 rounded-xl bg-[#DCEFDA] border border-[#CFE6CC] hover:bg-[#CFE6CC] text-[#2B6B55] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewDate(new Date())}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl bg-[#DCEFDA] border border-[#CFE6CC] hover:bg-[#CFE6CC] text-[#2B6B55] transition-colors"
                  >
                    Oggi
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-[#DCEFDA]/60 p-1 rounded-xl border border-[#CFE6CC]">
                  <span className="text-[10px] font-mono uppercase text-[#8AAE9E] px-2">
                    Area:
                  </span>
                  {(['all', 'Chiesa', 'Rhema', 'Arcer'] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setCurrentAreaFilter(a)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        currentAreaFilter === a
                          ? 'bg-[#2D8B6F] text-white shadow-xs'
                          : 'text-[#2B6B55] hover:text-[#2D8B6F]'
                      }`}
                    >
                      {a === 'all' ? 'Tutte' : a}
                    </button>
                  ))}
                </div>

                {(isAdmin || isLeader) && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setEventFormState({
                        id: '',
                        title: '',
                        location: 'Chiesa',
                        date: new Date().toISOString().split('T')[0],
                        startTime: '18:00',
                        endTime: '19:30',
                        recurrence: 'none',
                        status: 'active',
                        notes: '',
                      });
                      setShowEventForm(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#2D8B6F] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#2D8B6F]/20 hover:bg-[#2B6B55] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuova Attività</span>
                  </motion.button>
                )}
              </div>

              <div className="mt-6">
                <div className="grid grid-cols-7 gap-px bg-[#CFE6CC] rounded-2xl overflow-hidden border border-[#CFE6CC]">
                  {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(
                    (d) => (
                      <div
                        key={d}
                        className="bg-[#DCEFDA] py-3 text-center text-[11px] font-mono uppercase text-[#2B6B55] font-semibold"
                      >
                        {d}
                      </div>
                    )
                  )}

                  {calendarDays.map((cell, idx) => {
                    const dayEvts = cell.dateStr
                      ? getEventsForDate(cell.dateStr).filter(
                          (e) =>
                            currentAreaFilter === 'all' ||
                            e.location === currentAreaFilter
                        )
                      : [];

                    return (
                      <div
                        key={idx}
                        onClick={() =>
                          cell.dateStr && setSelectedCalendarDate(cell.dateStr)
                        }
                        className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors ${
                          cell.isOutside
                            ? 'bg-[#DCEFDA]/20 text-[#8AAE9E]/50 pointer-events-none'
                            : 'bg-white hover:bg-[#DCEFDA]/30 cursor-pointer'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-xs font-semibold ${
                              cell.isToday
                                ? 'w-6 h-6 rounded-full bg-[#2D8B6F] text-white flex items-center justify-center'
                                : 'text-[#2B6B55]'
                            }`}
                          >
                            {cell.day}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {dayEvts.slice(0, 3).map((ev) => (
                            <div
                              key={ev.id}
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate border ${
                                ev.location === 'Chiesa'
                                  ? 'bg-[#DCEFDA] text-[#2B6B55] border-[#CFE6CC]'
                                  : ev.location === 'Rhema'
                                  ? 'bg-[#CFE6CC] text-[#2B6B55] border-[#8AAE9E]/40'
                                  : 'bg-emerald-50 text-[#2B6B55] border-[#8AAE9E]/30'
                              } ${
                                ev.status === 'suspended'
                                  ? 'line-through opacity-40'
                                  : ''
                              }`}
                            >
                              {ev.startTime} {ev.title}
                            </div>
                          ))}
                          {dayEvts.length > 3 && (
                            <span className="text-[9px] font-mono text-[#8AAE9E] block">
                              +{dayEvts.length - 3} altri
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {selectedCalendarDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white border border-[#CFE6CC] rounded-3xl p-6 shadow-xs"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-[#CFE6CC] mb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#8AAE9E]">
                        Dettaglio Impegni
                      </span>
                      <h3 className="text-base font-semibold text-[#2B6B55] capitalize">
                        {new Date(
                          selectedCalendarDate + 'T00:00:00'
                        ).toLocaleDateString('it-IT', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {(isAdmin || isLeader) && (
                        <button
                          onClick={() => {
                            setEventFormState({
                              id: '',
                              title: '',
                              location: 'Chiesa',
                              date: selectedCalendarDate,
                              startTime: '18:00',
                              endTime: '19:30',
                              recurrence: 'none',
                              status: 'active',
                              notes: '',
                            });
                            setShowEventForm(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#2D8B6F] text-white text-xs font-medium hover:bg-[#2B6B55] transition-colors"
                        >
                          + Aggiungi Attività
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCalendarDate(null)}
                        className="px-3 py-1.5 rounded-lg bg-[#DCEFDA] text-[#2B6B55] text-xs hover:bg-[#CFE6CC] transition-colors"
                      >
                        Chiudi
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {getEventsForDate(selectedCalendarDate).length === 0 ? (
                      <p className="text-xs text-[#8AAE9E] py-3">
                        Nessuna attività programmata. Tutte le 3 sale sono
                        disponibili.
                      </p>
                    ) : (
                      getEventsForDate(selectedCalendarDate).map((ev) => (
                        <div
                          key={ev.id}
                          className="p-4 rounded-2xl bg-[#DCEFDA]/30 border border-[#CFE6CC] flex justify-between items-start"
                        >
                          <div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                ev.location === 'Chiesa'
                                  ? 'bg-[#DCEFDA] text-[#2B6B55] border-[#CFE6CC]'
                                  : ev.location === 'Rhema'
                                  ? 'bg-[#CFE6CC] text-[#2B6B55] border-[#8AAE9E]/40'
                                  : 'bg-emerald-50 text-[#2B6B55] border-[#8AAE9E]/30'
                              }`}
                            >
                              {ev.location}
                            </span>
                            <h4 className="text-sm font-semibold text-[#2B6B55] mt-2">
                              {ev.title}
                            </h4>
                            <div className="text-xs text-[#8AAE9E] mt-1 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {ev.startTime} – {ev.endTime}
                              </span>
                            </div>
                            {ev.notes && (
                              <p className="text-xs text-[#2B6B55]/70 mt-2">
                                {ev.notes}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono uppercase text-[#2B6B55] px-2 py-0.5 rounded bg-[#CFE6CC]">
                              {ev.status}
                            </span>
                            {(isAdmin || isLeader) && (
                              <button
                                onClick={() => {
                                  setEventFormState({
                                    id: ev.id,
                                    title: ev.title,
                                    location: ev.location,
                                    date: selectedCalendarDate,
                                    startTime: ev.startTime,
                                    endTime: ev.endTime,
                                    recurrence: ev.recurrence,
                                    status: ev.status,
                                    notes: ev.notes || '',
                                  });
                                  setShowEventForm(true);
                                }}
                                className="block mt-3 text-xs text-[#2D8B6F] font-medium hover:underline"
                              >
                                Modifica
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* VISTA 3: SQUADRE & TURNI */}
        {currentView === 'teams' && (isAdmin || isLeader) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springSmooth}
            className="space-y-6"
          >
            <div className="bg-white border border-[#CFE6CC] rounded-3xl p-6 shadow-xs">
              <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-[#CFE6CC] mb-6">
                <div>
                  <h3 className="text-base font-semibold text-[#2B6B55]">
                    Coordinamento Squadre & Turni
                  </h3>
                  <p className="text-xs text-[#8AAE9E] mt-1">
                    Incrocio presenze confermate e assegnazione ruoli di
                    servizio per ciascun evento.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono text-[#8AAE9E] uppercase">
                    Squadra:
                  </label>
                  <select
                    value={selectedTeamView}
                    onChange={(e) => setSelectedTeamView(e.target.value)}
                    className="bg-[#DCEFDA]/30 border border-[#CFE6CC] rounded-xl px-3 py-1.5 text-xs text-[#2B6B55] outline-none"
                  >
                    {TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-xs font-mono uppercase text-[#8AAE9E] mb-3">
                  Disponibilità fornite dai Membri
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-[#CFE6CC]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#DCEFDA] border-b border-[#CFE6CC] text-[#2B6B55] font-mono text-[11px] uppercase">
                        <th className="p-3">Membro</th>
                        {nextServiceDates.slice(0, 4).map((d) => (
                          <th key={d.toISOString()} className="p-3 text-center">
                            {d.toISOString().split('T')[0].substring(5)} (
                            {d.getDay() === 0 ? 'Dom' : 'Ven'})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CFE6CC]">
                      {users.filter(
                        (u) =>
                          u.team === selectedTeamView && u.status === 'approved'
                      ).length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-6 text-center text-[#8AAE9E]"
                          >
                            Nessun membro registrato in questa squadra.
                          </td>
                        </tr>
                      ) : (
                        users
                          .filter(
                            (u) =>
                              u.team === selectedTeamView &&
                              u.status === 'approved'
                          )
                          .map((m) => (
                            <tr
                              key={m.id}
                              className="hover:bg-[#DCEFDA]/20 transition-colors"
                            >
                              <td className="p-3 font-medium text-[#2B6B55]">
                                {m.name} {m.role === 'team_leader' && '⭐'}
                              </td>
                              {nextServiceDates.slice(0, 4).map((d) => {
                                const iso = d.toISOString().split('T')[0];
                                const rec =
                                  availabilityRecords[`${m.id}_${iso}`];

                                return (
                                  <td key={iso} className="p-3 text-center">
                                    {!rec ? (
                                      <span className="text-[#8AAE9E]">-</span>
                                    ) : rec.status === 'available' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DCEFDA] text-[#2B6B55] border border-[#CFE6CC]">
                                        SÌ
                                      </span>
                                    ) : rec.status === 'maybe' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200">
                                        RIS.
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-50 text-rose-600 border border-rose-200">
                                        NO
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-6 border-t border-[#CFE6CC]">
                <h4 className="text-xs font-mono uppercase text-[#8AAE9E] mb-3">
                  Assegna Turno di Servizio
                </h4>
                <form
                  onSubmit={handleAssignDuty}
                  className="flex flex-wrap gap-3 items-end mb-6"
                >
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                      Data
                    </label>
                    <select
                      value={dutyAssignDate}
                      onChange={(e) => setDutyAssignDate(e.target.value)}
                      className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-xl px-3 py-2 text-xs text-[#2B6B55] outline-none"
                    >
                      {nextServiceDates.map((d) => {
                        const iso = d.toISOString().split('T')[0];
                        return (
                          <option key={iso} value={iso}>
                            {iso} -{' '}
                            {d.getDay() === 0
                              ? 'Domenica (Culto)'
                              : 'Venerdì (Preghiera)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                      Membro
                    </label>
                    <select
                      value={dutyAssignMember}
                      onChange={(e) => setDutyAssignMember(e.target.value)}
                      className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-xl px-3 py-2 text-xs text-[#2B6B55] outline-none"
                    >
                      <option value="">Seleziona membro...</option>
                      {users
                        .filter(
                          (u) =>
                            u.team === selectedTeamView &&
                            u.status === 'approved'
                        )
                        .map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#2D8B6F] hover:bg-[#2B6B55] text-white font-medium text-xs shadow-md shadow-[#2D8B6F]/20 transition-colors"
                  >
                    Conferma in Turno
                  </motion.button>
                </form>

                <div className="space-y-2">
                  {duties.filter((d) => d.team === selectedTeamView).length ===
                  0 ? (
                    <p className="text-xs text-[#8AAE9E]">
                      Nessun turno assegnato per questa squadra.
                    </p>
                  ) : (
                    duties
                      .filter((d) => d.team === selectedTeamView)
                      .map((d) => (
                        <div
                          key={d.id}
                          className="flex justify-between items-center p-3 rounded-xl bg-[#DCEFDA]/30 border border-[#CFE6CC] text-xs"
                        >
                          <div>
                            <span className="font-mono text-[#8AAE9E] mr-2">
                              {d.date}
                            </span>
                            <span className="font-semibold text-[#2B6B55]">
                              {d.memberName}
                            </span>
                          </div>
                          <button
                            onClick={() => removeDuty(d.id)}
                            className="text-xs text-rose-600 hover:underline font-medium"
                          >
                            Rimuovi
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VISTA 4: MIE DISPONIBILITÀ */}
        {currentView === 'availability' && isMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springSmooth}
            className="space-y-6"
          >
            <div className="bg-white border border-[#CFE6CC] rounded-3xl p-6 shadow-xs">
              <h3 className="text-base font-semibold text-[#2B6B55] mb-1">
                Le Mie Disponibilità di Servizio
              </h3>
              <p className="text-xs text-[#8AAE9E] mb-6">
                Comunica al tuo Team Leader la tua presenza per i prossimi
                incontri comunitari.
              </p>

              <form
                onSubmit={handleSaveAvailability}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8"
              >
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                    Data Incontro
                  </label>
                  <select
                    value={selectedAvailDate}
                    onChange={(e) => setSelectedAvailDate(e.target.value)}
                    className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-xl px-3 py-2 text-xs text-[#2B6B55] outline-none"
                  >
                    {nextServiceDates.map((d) => {
                      const iso = d.toISOString().split('T')[0];
                      return (
                        <option key={iso} value={iso}>
                          {iso} -{' '}
                          {d.getDay() === 0
                            ? 'Domenica (Culto)'
                            : 'Venerdì (Preghiera)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                    Stato Presenza
                  </label>
                  <select
                    value={selectedAvailStatus}
                    onChange={(e) =>
                      setSelectedAvailStatus(e.target.value as any)
                    }
                    className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-xl px-3 py-2 text-xs text-[#2B6B55] outline-none"
                  >
                    <option value="available">✅ Disponibile</option>
                    <option value="maybe">⚠️ Con riserva</option>
                    <option value="unavailable">❌ Non Disponibile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8AAE9E] mb-1">
                    Note (opzionale)
                  </label>
                  <input
                    type="text"
                    value={availNote}
                    onChange={(e) => setAvailNote(e.target.value)}
                    placeholder="es. Solo mattina..."
                    className="w-full bg-[#DCEFDA]/20 border border-[#CFE6CC] rounded-xl px-3 py-2 text-xs text-[#2B6B55] outline-none"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="w-full py-2 bg-[#2D8B6F] hover:bg-[#2B6B55] text-white font-medium text-xs rounded-xl shadow-md shadow-[#2D8B6F]/20 transition-colors"
                >
                  Salva Disponibilità
                </motion.button>
              </form>

              <h4 className="text-xs font-mono uppercase text-[#8AAE9E] mb-3">
                Le tue risposte salvate
              </h4>
              <div className="space-y-2">
                {Object.values(availabilityRecords).filter(
                  (r) => r.userId === currentUser.id
                ).length === 0 ? (
                  <p className="text-xs text-[#8AAE9E]">
                    Non hai ancora inserito disponibilità.
                  </p>
                ) : (
                  Object.values(availabilityRecords)
                    .filter((r) => r.userId === currentUser.id)
                    .map((ent) => (
                      <div
                        key={ent.date}
                        className="flex justify-between items-center p-3 rounded-xl bg-[#DCEFDA]/30 border border-[#CFE6CC] text-xs"
                      >
                        <div>
                          <span className="font-mono text-[#2B6B55] font-semibold mr-2">
                            {ent.date}
                          </span>
                          {ent.note && (
                            <span className="text-[#8AAE9E] italic">
                              ("{ent.note}")
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium ${
                            ent.status === 'available'
                              ? 'bg-[#DCEFDA] text-[#2B6B55] border border-[#CFE6CC]'
                              : ent.status === 'maybe'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {ent.status === 'available'
                            ? 'Disponibile'
                            : ent.status === 'maybe'
                            ? 'Con riserva'
                            : 'Assente'}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
