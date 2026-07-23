import re

with open("src/services/timerEngine.ts", "r") as f:
    code = f.read()

# 1. Remove notification imports
code = re.sub(r'import\s*\{[^}]*notificationService[^}]*\}\s*from\s*"[^"]*notificationService";', '', code, flags=re.MULTILINE|re.DOTALL)

# 2. Remove scheduleRemainingMilestones function entirely
# We'll use a regex to match from "private async scheduleRemainingMilestones(" until the end of that method.
# Wait, it's easier to find the index and match braces manually.
def remove_function(code_str, func_name):
    idx = code_str.find(func_name)
    if idx == -1: return code_str
    
    # Find start of comment block above it if any
    comment_idx = code_str.rfind("// ─── Notification scheduling", 0, idx)
    if comment_idx != -1:
        start_idx = comment_idx
    else:
        start_idx = code_str.rfind("private", 0, idx)
        
    brace_idx = code_str.find("{", idx)
    brace_count = 1
    i = brace_idx + 1
    while brace_count > 0 and i < len(code_str):
        if code_str[i] == "{": brace_count += 1
        elif code_str[i] == "}": brace_count -= 1
        i += 1
    return code_str[:start_idx] + code_str[i:]

code = remove_function(code, "scheduleRemainingMilestones")

# 3. Remove cancelAllNotifications(); calls
code = re.sub(r'^\s*cancelAllNotifications\(\);\s*$', '', code, flags=re.MULTILINE)

# 4. Remove this.scheduleRemainingMilestones(...) calls
code = re.sub(r'^\s*this\.scheduleRemainingMilestones\([^)]*\);\s*$', '', code, flags=re.MULTILINE)

# 5. Fix remaining comments about notification
code = code.replace(
"""  // Notification scheduling is NOT done here — all alarms were already
  // registered at start() or resume() time and Android fires them on its own.""", "")

code = code.replace(
"""    // (updating the display, persisting sessions, driving the next
    // handleComplete call). It does NOT trigger notification scheduling —
    // all alarms are already registered in Android's queue.""",
"""    // (updating the display, persisting sessions, driving the next
    // handleComplete call).""")

code = code.replace(
"""      // No scheduleRemainingMilestones call here. Android already has every
      // alarm that was registered at start() or resume().""", "")

code = code.replace(
"""    // cancelAllNotifications begins a new operation, which invalidates any
    // in-flight scheduleRemainingMilestones call from start() or resume().""", "")

code = code.replace(
"""    // Cancel every pending native alarm and stop the JS timeout.""",
"""    // Stop the JS timeout.""")

code = code.replace(
"""    // Recalculate every remaining milestone from the new targetEndTime and
    // register them all with Android. Resume is silent (no START_FOCUS).""", "")

code = code.replace(
"""  // When Android fired alarms while the app was backgrounded, those
  // notifications have already been delivered. The catch-up loop here updates
  // JS state and the database to match what Android already did natively.
  //
  // After catch-up, if the timer is still running, scheduleRemainingMilestones
  // is called to re-register any alarms that are still in the future. This
  // handles the edge case where the OS killed the app process (clearing the
  // native alarm queue) before all alarms fired — in that scenario, Zustand
  // rehydrates the running state and handleHydration calls syncBackgroundTime,
  // which rebuilds the alarm schedule for whatever remains.""", 
"""  // When the app was backgrounded, some phases may have completed.
  // The catch-up loop here updates JS state and the database.
  //
  // After catch-up, if the timer is still running, the JS timeout is restarted.""")

code = code.replace(
"""      // Current phase has not ended yet. Restart the JS timeout and
      // re-register any alarms that are still outstanding.""",
"""      // Current phase has not ended yet. Restart the JS timeout.""")

code = code.replace(
"""      // Notification scheduling inside handleComplete was already removed,
      // so isCatchUp has no effect on notifications.""", "")

code = code.replace(
"""    // After catch-up, re-register alarms for any phases that are still in
    // the future and restart the JS timeout for the current phase.""",
"""    // After catch-up, restart the JS timeout for the current phase.""")

code = code.replace(
"""      // syncBackgroundTime will call scheduleRemainingMilestones if needed.""", "")

code = code.replace(
"""      // Retain paused state exactly as persisted. No alarms to register.""",
"""      // Retain paused state exactly as persisted.""")

code = code.replace(
"""    // Schedule every remaining cycle alarm at once.
    // START_FOCUS fires immediately for Focus phases; Break phases are silent.""", "")

with open("src/services/timerEngine.ts", "w") as f:
    f.write(code)

