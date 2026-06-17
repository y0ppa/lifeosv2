/* ==========================================================================
   LifeOS — Voice / chat command matching
   Maps natural-language demo commands to read-only answers or confirmed
   data-changing actions. Used by both the chat assistant and the voice
   console so behavior stays identical across input methods.

   Read-only questions answer immediately. Anything that deletes records,
   changes goals/targets, reschedules events, sends messages, disconnects
   integrations, performs bulk updates, completes important tasks, edits
   application status, or changes workout programming requires explicit
   confirmation before it is applied.
   ========================================================================== */
(function (global) {
  'use strict';

  function State() { return global.LifeOS.State; }
  function data() { return State().data; }

  function fmtTime(t) {
    var parts = t.split(':');
    var h = parseInt(parts[0], 10);
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + parts[1] + ' ' + ampm;
  }

  function caloriesRemaining() {
    var c = data().today.calories;
    return Math.max(0, c.target - c.consumed);
  }
  function proteinRemaining() {
    var p = data().today.protein;
    return Math.max(0, p.target - p.consumed);
  }

  function briefingText() {
    var d = data();
    var name = d.profile.name;
    var workout = d.workouts.today;
    var sleep = d.today.sleep;
    var task = d.work.tasks.filter(function (t) { return !t.completed; })[0];
    var parts = [];
    parts.push('Good ' + dayPart() + ', ' + name + '.');
    parts.push('You have ' + caloriesRemaining() + ' calories and ' + proteinRemaining() + ' grams of protein remaining today.');
    if (workout && !workout.completed) parts.push(workout.name + ' is planned for ' + fmtTime(workout.time) + '.');
    parts.push('You slept ' + sleep.hours + ' hours and ' + sleep.minutes + ' minutes.');
    if (task) parts.push(task.title + ' is due ' + task.due + '.');
    return parts.join(' ');
  }

  function dayPart() {
    var h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  function lastLiftText(exerciseHint) {
    var ex = data().workouts.today.exercises;
    var match = ex.find(function (e) { return exerciseHint && e.name.toLowerCase().indexOf(exerciseHint) !== -1; }) || ex[0];
    return 'Last time you lifted ' + match.lastWeight + ' ' + match.unit + ' for ' + match.lastReps + ' reps on ' + match.name + '.';
  }

  function groceryList() {
    var items = {};
    data().nutrition.recentFoods.forEach(function (f) { items[f.name.replace(/\s*\(.*?\)/, '')] = true; });
    return Object.keys(items).slice(0, 6);
  }

  // ---- command table ----
  var COMMANDS = [
    {
      test: /day look|morning briefing|plan my day|brief me|give me my (morning )?briefing/i,
      run: function () { return { reply: briefingText() }; }
    },
    {
      test: /how (many|much) calories/i,
      run: function () { return { reply: 'You have ' + caloriesRemaining() + ' calories remaining today, out of a ' + data().today.calories.target + ' calorie target.' }; }
    },
    {
      test: /how much protein/i,
      run: function () { return { reply: 'You need ' + proteinRemaining() + ' more grams of protein to hit your ' + data().today.protein.target + ' gram target.' }; }
    },
    {
      test: /how many steps/i,
      run: function () { var s = data().today.steps; return { reply: 'You have logged ' + s.count.toLocaleString() + ' of ' + s.target.toLocaleString() + ' steps today.' }; }
    },
    {
      test: /start (my )?workout/i,
      run: function () { return { reply: 'Starting ' + data().workouts.today.name + '. Opening your workout session now.', navigate: 'workout-session.html' }; }
    },
    {
      test: /what did i lift last time|last time.*lift/i,
      run: function (m) { return { reply: lastLiftText(null) }; }
    },
    {
      test: /log (\d+(\.\d+)?) pounds? for (\d+) reps?/i,
      run: function (m) {
        var weight = parseFloat(m[1]);
        var reps = parseInt(m[3], 10);
        return {
          reply: 'I can log ' + weight + ' pounds for ' + reps + ' reps on your current exercise. Should I continue?',
          needsConfirm: true,
          confirmSummary: 'Log ' + weight + ' lb x ' + reps + ' reps',
          onConfirm: function () {
            var ex = data().workouts.today.exercises[0];
            ex.lastWeight = weight;
            ex.lastReps = reps;
            State().save();
            return 'Logged ' + weight + ' pounds for ' + reps + ' reps on ' + ex.name + '.';
          }
        };
      }
    },
    {
      test: /add (\d+) ?(ounces?|oz) of (.+)/i,
      run: function (m) {
        var qty = m[1], food = m[3];
        return {
          reply: 'Added ' + qty + ' ounces of ' + food + ' to today’s log.',
          action: function () {
            data().nutrition.meals.push({ id: 'm' + Date.now(), name: 'Logged item', time: new Date().toTimeString().slice(0, 5), calories: 0, protein: 0, carbs: 0, fat: 0, items: [qty + ' oz ' + food] });
            State().save();
          }
        };
      }
    },
    {
      test: /mark (my )?morning weigh-?in complete/i,
      run: function () {
        var h = data().habits.find(function (x) { return /weigh-?in/i.test(x.name); });
        return {
          reply: 'Morning weigh-in marked complete. Nice work staying consistent.',
          action: function () { if (h) { h.completedToday = true; State().save(); } }
        };
      }
    },
    {
      test: /move my workout to tomorrow|reschedule.*workout/i,
      run: function () {
        var w = data().workouts.today;
        return {
          reply: 'I can move ' + w.name + ' from today at ' + fmtTime(w.time) + ' to tomorrow at ' + fmtTime(w.time) + '. Should I continue?',
          needsConfirm: true,
          confirmSummary: 'Reschedule ' + w.name + ' to tomorrow, ' + fmtTime(w.time),
          onConfirm: function () {
            w.rescheduled = true;
            State().save();
            return w.name + ' has been moved to tomorrow at ' + fmtTime(w.time) + '.';
          }
        };
      }
    },
    {
      test: /what assignments are due|upcoming deadlines|assignments due/i,
      run: function () {
        var items = data().work.tasks.filter(function (t) { return t.type === 'assignment' && !t.completed; });
        if (!items.length) return { reply: 'You have no assignments due right now.' };
        return { reply: items.map(function (t) { return t.title + ' (' + t.course + ') due ' + t.due; }).join('. ') };
      }
    },
    {
      test: /start a (\d+)[- ]minute focus session|focus session/i,
      run: function (m) {
        var mins = m[1] ? parseInt(m[1], 10) : 25;
        return {
          reply: 'Starting a ' + mins + '-minute focus session.',
          action: function () {
            data().work.focusSessionsToday += 1;
            data().work.focusMinutesToday += mins;
            State().save();
          }
        };
      }
    },
    {
      test: /recent job applications|show.*applications|review my applications/i,
      run: function () {
        var apps = data().applications.slice(0, 3);
        return { reply: apps.map(function (a) { return a.role + ' at ' + a.company + ' — ' + a.status; }).join('. ') };
      }
    },
    {
      test: /remind me to follow up/i,
      run: function () {
        return { reply: 'I’ll remind you to follow up. I’ve noted it on your application pipeline.' };
      }
    },
    {
      test: /analyze my (progress|weight trend)|review this week.*workouts/i,
      run: function () {
        var hist = data().weight.history;
        var delta = (hist[hist.length - 1].value - hist[Math.max(0, hist.length - 8)].value).toFixed(1);
        return { reply: 'Over the last seven days your weight changed by ' + delta + ' pounds, and you completed ' + data().workouts.history.length + ' workouts. You’re trending in the right direction.' };
      }
    },
    {
      test: /build a grocery list|grocery list/i,
      run: function () {
        var list = groceryList();
        return { reply: 'I’ve built a grocery list with ' + list.length + ' items: ' + list.join(', ') + '.' };
      }
    },
    {
      test: /stop speaking|stop talking|be quiet/i,
      run: function () {
        if (global.LifeOS.Voice) global.LifeOS.Voice.stopSpeaking();
        return { reply: '', silent: true };
      }
    },
    {
      test: /suggest a meal/i,
      run: function () {
        var r = data().nutrition.recipes[0];
        return { reply: 'Based on your remaining macros, I’d suggest ' + r.name + ' — about ' + r.calories + ' calories and ' + r.protein + ' grams of protein.' };
      }
    }
  ];

  function process(text) {
    for (var i = 0; i < COMMANDS.length; i++) {
      var m = text.match(COMMANDS[i].test);
      if (m) return COMMANDS[i].run(m);
    }
    return {
      reply: 'I don’t have a demo response for that yet, but here’s your current snapshot: ' + briefingText()
    };
  }

  global.LifeOS = global.LifeOS || {};
  global.LifeOS.Commands = { process: process, briefingText: briefingText };
})(window);
