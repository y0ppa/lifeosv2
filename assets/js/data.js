/* ==========================================================================
   Brain — Sample data + persistent state
   All numbers are realistic SAMPLE DATA for demonstration only. State is
   persisted to localStorage so interactions (habit toggles, logged sets,
   weight entries, etc.) survive a reload.
   ========================================================================== */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'lifeos.state.v1';

  // ---- deterministic pseudo-random helper so "demo" series look organic
  // but are stable between loads unless the user changes them. ----
  function seeded(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function daysAgoISO(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function buildWeightHistory() {
    var rand = seeded(42);
    var out = [];
    var v = 200.8;
    for (var i = 34; i >= 0; i--) {
      v -= 0.11 + rand() * 0.08;
      if (rand() < 0.12) v += rand() * 0.6;
      out.push({ date: daysAgoISO(i), value: Math.round(v * 10) / 10 });
    }
    out[out.length - 1].value = 196.4;
    return out;
  }

  function buildSeries(len, base, variance, seed, trendPerStep) {
    var rand = seeded(seed);
    var out = [];
    var v = base;
    for (var i = len - 1; i >= 0; i--) {
      var val = Math.max(0, v + (rand() - 0.5) * variance);
      out.push({ date: daysAgoISO(i), value: Math.round(val) });
      v += (trendPerStep || 0);
    }
    return out;
  }

  var DEFAULT_DATA = {
    meta: { version: 1, createdAt: new Date().toISOString(), isSampleData: true },

    profile: {
      name: 'Mat',
      initials: 'M',
      email: 'mat@example.com',
      assistantName: 'ARIA',
      memberSince: '2025-01-08'
    },

    goals: {
      calories: 1900,
      protein: 190,
      carbs: 220,
      fat: 70,
      fiber: 30,
      waterOz: 100,
      steps: 10000,
      sleepHours: 8,
      weightGoalLb: 185,
      weeklyWorkouts: 5
    },

    today: {
      calories: { consumed: 1080, target: 1900 },
      protein: { consumed: 122, target: 190 },
      carbs: { consumed: 140, target: 220 },
      fat: { consumed: 38, target: 70 },
      fiber: { consumed: 21, target: 30 },
      waterOz: { consumed: 64, target: 100 },
      steps: { count: 7420, target: 10000 },
      sleep: { hours: 6, minutes: 20, target: 8 }
    },

    weight: {
      unit: 'lb',
      goal: 185,
      history: buildWeightHistory()
    },

    workouts: {
      split: [
        { day: 'Mon', name: 'Upper Body' },
        { day: 'Tue', name: 'Lower Body' },
        { day: 'Wed', name: 'Rest' },
        { day: 'Thu', name: 'Push' },
        { day: 'Fri', name: 'Pull' },
        { day: 'Sat', name: 'Legs' },
        { day: 'Sun', name: 'Rest' }
      ],
      today: {
        id: 'w-today',
        name: 'Upper Body',
        time: '09:00',
        durationMin: 55,
        completed: false,
        exercises: [
          { name: 'Incline Smith Press', sets: 4, reps: 8, weight: 135, unit: 'lb', lastWeight: 130, lastReps: 8 },
          { name: 'Seated Row', sets: 4, reps: 10, weight: 120, unit: 'lb', lastWeight: 115, lastReps: 10 },
          { name: 'Lat Pulldown', sets: 3, reps: 12, weight: 100, unit: 'lb', lastWeight: 100, lastReps: 10 },
          { name: 'Shoulder Press', sets: 3, reps: 10, weight: 65, unit: 'lb', lastWeight: 60, lastReps: 10 },
          { name: 'Lateral Raise', sets: 3, reps: 15, weight: 20, unit: 'lb', lastWeight: 20, lastReps: 12 },
          { name: 'Cable Curl', sets: 3, reps: 12, weight: 40, unit: 'lb', lastWeight: 35, lastReps: 12 },
          { name: 'Triceps Pressdown', sets: 3, reps: 12, weight: 50, unit: 'lb', lastWeight: 45, lastReps: 12 }
        ]
      },
      templates: [
        { id: 't1', name: 'Upper Body', exerciseCount: 7, estMinutes: 55 },
        { id: 't2', name: 'Lower Body', exerciseCount: 6, estMinutes: 50 },
        { id: 't3', name: 'Push', exerciseCount: 6, estMinutes: 48 },
        { id: 't4', name: 'Pull', exerciseCount: 6, estMinutes: 50 },
        { id: 't5', name: 'Legs', exerciseCount: 7, estMinutes: 58 }
      ],
      history: [
        { date: daysAgoISO(1), name: 'Lower Body', durationMin: 52, volumeLb: 18400, sets: 22 },
        { date: daysAgoISO(3), name: 'Pull', durationMin: 49, volumeLb: 15200, sets: 20 },
        { date: daysAgoISO(4), name: 'Push', durationMin: 47, volumeLb: 14100, sets: 19 },
        { date: daysAgoISO(6), name: 'Legs', durationMin: 58, volumeLb: 21200, sets: 24 },
        { date: daysAgoISO(8), name: 'Upper Body', durationMin: 55, volumeLb: 16800, sets: 21 }
      ],
      personalRecords: [
        { exercise: 'Barbell Back Squat', weight: 245, reps: 5, date: daysAgoISO(12) },
        { exercise: 'Bench Press', weight: 185, reps: 5, date: daysAgoISO(20) },
        { exercise: 'Deadlift', weight: 315, reps: 3, date: daysAgoISO(6) },
        { exercise: 'Overhead Press', weight: 115, reps: 6, date: daysAgoISO(28) }
      ],
      weeklySetsByMuscle: { Chest: 14, Back: 18, Legs: 22, Shoulders: 12, Arms: 16, Core: 10 },
      strengthTrend: buildSeries(12, 280, 6, 7, 1.4)
    },

    nutrition: {
      meals: [
        { id: 'm1', name: 'Breakfast', time: '07:10', calories: 410, protein: 38, carbs: 42, fat: 12, items: ['Greek yogurt', 'Granola', 'Blueberries', 'Black coffee'] },
        { id: 'm2', name: 'Lunch', time: '12:30', calories: 520, protein: 48, carbs: 55, fat: 14, items: ['Grilled chicken bowl', 'Brown rice', 'Broccoli'] },
        { id: 'm3', name: 'Snack', time: '15:45', calories: 150, protein: 36, carbs: 4, fat: 2, items: ['Whey protein shake'] }
      ],
      savedMeals: [
        { id: 's1', name: 'Chicken & Rice Bowl', calories: 520, protein: 48 },
        { id: 's2', name: 'Protein Oats', calories: 380, protein: 32 },
        { id: 's3', name: 'Turkey Wrap', calories: 440, protein: 36 }
      ],
      recentFoods: [
        { id: 'f1', name: 'Chicken Breast (6oz)', calories: 280, protein: 52 },
        { id: 'f2', name: 'Banana', calories: 105, protein: 1 },
        { id: 'f3', name: 'Greek Yogurt (1 cup)', calories: 150, protein: 20 },
        { id: 'f4', name: 'Brown Rice (1 cup)', calories: 215, protein: 5 },
        { id: 'f5', name: 'Almonds (1oz)', calories: 164, protein: 6 }
      ],
      recipes: [
        { id: 'r1', name: 'High-Protein Overnight Oats', calories: 380, protein: 32, minutes: 5 },
        { id: 'r2', name: 'Sheet-Pan Chicken & Veggies', calories: 460, protein: 44, minutes: 35 },
        { id: 'r3', name: 'Salmon Power Bowl', calories: 510, protein: 41, minutes: 25 }
      ],
      weeklyAverages: { calories: 1840, protein: 178, fiber: 27, water: 88 }
    },

    habits: [
      { id: 'h1', name: 'Morning weigh-in', category: 'Health', completedToday: true, streak: 12, week: [1, 1, 1, 1, 1, 1, 0], paused: false },
      { id: 'h2', name: 'Drink water (100oz)', category: 'Health', completedToday: false, streak: 4, week: [1, 1, 0, 1, 1, 0, 0], paused: false },
      { id: 'h3', name: 'Reach protein goal', category: 'Nutrition', completedToday: false, streak: 6, week: [1, 1, 1, 0, 1, 1, 0], paused: false },
      { id: 'h4', name: 'Reach fiber goal', category: 'Nutrition', completedToday: false, streak: 2, week: [0, 1, 0, 1, 0, 1, 0], paused: false },
      { id: 'h5', name: 'Complete workout', category: 'Fitness', completedToday: false, streak: 9, week: [1, 1, 1, 1, 0, 1, 1], paused: false },
      { id: 'h6', name: 'Walk 10,000 steps', category: 'Fitness', completedToday: false, streak: 3, week: [1, 0, 1, 1, 0, 0, 1], paused: false },
      { id: 'h7', name: 'Study cybersecurity', category: 'Growth', completedToday: false, streak: 15, week: [1, 1, 1, 1, 1, 1, 1], paused: false },
      { id: 'h8', name: 'Practice drawing', category: 'Growth', completedToday: false, streak: 5, week: [1, 1, 0, 1, 1, 0, 1], paused: false },
      { id: 'h9', name: 'Apply to jobs', category: 'Career', completedToday: true, streak: 7, week: [1, 1, 1, 0, 1, 1, 1], paused: false },
      { id: 'h10', name: 'Sleep before 11:00 PM', category: 'Health', completedToday: false, streak: 1, week: [0, 1, 0, 0, 1, 0, 1], paused: false }
    ],

    work: {
      tasks: [
        { id: 'tk1', title: 'Internship follow-up email', type: 'task', priority: 'high', due: 'Today, 3:00 PM', completed: false },
        { id: 'tk2', title: 'Network Security problem set 4', type: 'assignment', course: 'CYBR 320', priority: 'high', due: 'Tomorrow, 11:59 PM', completed: false },
        { id: 'tk3', title: 'Portfolio site — case study draft', type: 'project', priority: 'med', due: 'Fri, 5:00 PM', completed: false },
        { id: 'tk4', title: 'Read Ch. 7 — Applied Cryptography', type: 'assignment', course: 'CYBR 320', priority: 'low', due: 'Mon', completed: false },
        { id: 'tk5', title: 'Submit time sheet', type: 'task', priority: 'med', due: 'Today, 6:00 PM', completed: true }
      ],
      events: [
        { id: 'ev1', title: 'Team standup', time: '09:55', type: 'meeting' },
        { id: 'ev2', title: 'Internship follow-up due', time: '15:00', type: 'deadline' },
        { id: 'ev3', title: 'Study block — Cybersecurity', time: '19:00', type: 'focus' }
      ],
      focusSessionsToday: 1,
      focusMinutesToday: 45,
      weeklyFocusMinutes: buildSeries(7, 90, 40, 11)
    },

    applications: [
      { id: 'a1', company: 'Nimbus Cloud', role: 'Security Engineering Intern', location: 'Remote', mode: 'Remote', dateApplied: daysAgoISO(2), status: 'Applied', followUp: daysAgoISO(-5), notes: 'Referred by Jordan.', source: 'LinkedIn', salary: null },
      { id: 'a2', company: 'Northwind Labs', role: 'SOC Analyst Intern', location: 'Austin, TX', mode: 'Hybrid', dateApplied: daysAgoISO(6), status: 'Assessment', followUp: daysAgoISO(-2), notes: 'Take-home due Friday.', source: 'Company site', salary: '$26/hr' },
      { id: 'a3', company: 'Vertex Systems', role: 'IT Security Intern', location: 'Remote', mode: 'Remote', dateApplied: daysAgoISO(10), status: 'Interview', followUp: daysAgoISO(-1), notes: 'Final round Thursday 2 PM.', source: 'Handshake', salary: '$24/hr' },
      { id: 'a4', company: 'Solace Health', role: 'AppSec Intern', location: 'Chicago, IL', mode: 'Onsite', dateApplied: daysAgoISO(15), status: 'Waitlisted', followUp: null, notes: '', source: 'Career fair', salary: null },
      { id: 'a5', company: 'Forge Robotics', role: 'Platform Security Intern', location: 'Remote', mode: 'Remote', dateApplied: daysAgoISO(20), status: 'Rejected', followUp: null, notes: 'Asked to reapply next cycle.', source: 'LinkedIn', salary: null },
      { id: 'a6', company: 'BrightLedger', role: 'Cybersecurity Intern', location: 'Remote', mode: 'Remote', dateApplied: daysAgoISO(1), status: 'Preparing', followUp: null, notes: 'Tailor resume bullets.', source: 'Referral', salary: null },
      { id: 'a7', company: 'Atlas Defense', role: 'SOC Intern', location: 'Denver, CO', mode: 'Onsite', dateApplied: null, status: 'Saved', followUp: null, notes: '', source: 'Indeed', salary: '$22/hr' },
      { id: 'a8', company: 'Quanta Systems', role: 'Cloud Security Intern', location: 'Remote', mode: 'Remote', dateApplied: daysAgoISO(30), status: 'Offer', followUp: null, notes: 'Decide by next week.', source: 'LinkedIn', salary: '$30/hr' }
    ],

    insights: {
      calories: buildSeries(30, 1850, 260, 1),
      protein: buildSeries(30, 175, 30, 2),
      fiber: buildSeries(30, 26, 6, 3),
      steps: buildSeries(30, 8600, 2400, 4),
      sleep: buildSeries(30, 7, 1.4, 5),
      weight: buildWeightHistory(),
      workoutFrequency: buildSeries(12, 4, 1.4, 6),
      trainingVolume: buildSeries(12, 16500, 3200, 8),
      strength: buildSeries(12, 280, 6, 7, 1.4),
      habitCompletion: buildSeries(12, 72, 14, 9),
      focusTime: buildSeries(12, 320, 80, 10),
      tasksCompleted: buildSeries(12, 14, 5, 12),
      applications: buildSeries(12, 3, 2, 13)
    },

    integrations: [
      { id: 'apple-health', name: 'Apple Health', connected: true, lastSync: '8 minutes ago', permissions: ['Steps', 'Workouts', 'Sleep'], error: null },
      { id: 'health-connect', name: 'Android Health Connect', connected: false, lastSync: null, permissions: ['Steps', 'Heart rate'], error: null },
      { id: 'google-calendar', name: 'Google Calendar', connected: true, lastSync: '20 minutes ago', permissions: ['Read events', 'Create events'], error: null },
      { id: 'gmail', name: 'Gmail', connected: false, lastSync: null, permissions: ['Read application emails'], error: null },
      { id: 'usda-fdc', name: 'USDA FoodData Central', connected: true, lastSync: '1 hour ago', permissions: ['Food database lookup'], error: null },
      { id: 'off', name: 'Open Food Facts', connected: true, lastSync: '1 hour ago', permissions: ['Barcode lookup'], error: null },
      { id: 'github', name: 'GitHub', connected: false, lastSync: null, permissions: ['Read repositories'], error: null },
      { id: 'push', name: 'Push Notifications', connected: true, lastSync: 'Active', permissions: ['Send notifications'], error: 'Last delivery delayed by 4 minutes' }
    ],

    settings: {
      theme: 'dark',
      units: 'imperial',
      notifications: { workouts: true, meals: true, habits: true, deadlines: true, applications: false },
      quietHours: { enabled: true, start: '22:00', end: '07:00' },
      voice: { enabled: true, rate: 1, volume: 0.8, voiceName: '', wakePhrase: true, soundEnabled: false, soundVolume: 0.4, shortcut: 'Alt+Shift+A' },
      schedule: { trainingDays: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'] }
    },

    conversation: []
  };

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeDefaults(target, defaults) {
    if (typeof target !== 'object' || target === null) return deepClone(defaults);
    Object.keys(defaults).forEach(function (key) {
      if (!(key in target)) {
        target[key] = deepClone(defaults[key]);
      }
    });
    return target;
  }

  var State = {
    data: null,

    load: function () {
      var raw = null;
      try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
      if (raw) {
        try {
          this.data = mergeDefaults(JSON.parse(raw), DEFAULT_DATA);
        } catch (e) {
          this.data = deepClone(DEFAULT_DATA);
        }
      } else {
        this.data = deepClone(DEFAULT_DATA);
      }
      return this.data;
    },

    save: function () {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ }
      document.dispatchEvent(new CustomEvent('lifeos:state-changed'));
    },

    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      this.data = deepClone(DEFAULT_DATA);
      this.save();
    }
  };

  State.load();

  global.Brain = global.Brain || {};
  global.Brain.State = State;
  global.Brain.DEFAULT_DATA = DEFAULT_DATA;
  global.Brain.util = { daysAgoISO: daysAgoISO, seeded: seeded };
})(window);
