import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, getDocFromServer, getDocs, writeBatch 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth } from "./firebase";
import { Task, Habit, BusyBlock, SavedPrefs, PlanningResponse, sanitizeApiKey } from "../types";

/**
 * Tests connection to Firestore on initial boot.
 */
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// ------------------ TASKS SYNC ------------------

export function syncTasks(userId: string, callback: (tasks: Task[]) => void, onError: (err: any) => void) {
  const path = `users/${userId}/tasks`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const tasksList: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tasksList.push({
          id: docSnap.id,
          title: data.title || "",
          notes: data.notes || "",
          dueDate: data.dueDate || "",
          estimatedMinutes: data.estimatedMinutes || 25,
          importance: data.importance || 3,
          tags: data.tags || [],
          subtasks: data.subtasks || [],
          completed: !!data.completed,
        });
      });
      callback(tasksList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError(error);
    }
  );
}

export async function dbSaveTask(userId: string, task: Task) {
  const path = `users/${userId}/tasks/${task.id}`;
  try {
    const taskData = {
      id: task.id,
      title: task.title,
      notes: task.notes || "",
      dueDate: task.dueDate || "",
      estimatedMinutes: Number(task.estimatedMinutes) || 25,
      importance: Number(task.importance) || 3,
      tags: task.tags || [],
      subtasks: task.subtasks || [],
      completed: !!task.completed,
      userId: userId,
    };
    await setDoc(doc(db, "users", userId, "tasks", task.id), taskData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteTask(userId: string, taskId: string) {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "tasks", taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ------------------ HABITS SYNC ------------------

export function syncHabits(userId: string, callback: (habits: Habit[]) => void, onError: (err: any) => void) {
  const path = `users/${userId}/habits`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const habitsList: Habit[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        habitsList.push({
          id: docSnap.id,
          name: data.name || "",
          streak: data.streak || 0,
          completedDays: data.completedDays || [],
        });
      });
      callback(habitsList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError(error);
    }
  );
}

export async function dbSaveHabit(userId: string, habit: Habit) {
  const path = `users/${userId}/habits/${habit.id}`;
  try {
    const habitData = {
      id: habit.id,
      name: habit.name,
      streak: Number(habit.streak) || 0,
      completedDays: habit.completedDays || [],
      userId: userId,
    };
    await setDoc(doc(db, "users", userId, "habits", habit.id), habitData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteHabit(userId: string, habitId: string) {
  const path = `users/${userId}/habits/${habitId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "habits", habitId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ------------------ BUSY BLOCKS SYNC ------------------

export function syncBusyBlocks(userId: string, callback: (blocks: BusyBlock[]) => void, onError: (err: any) => void) {
  const path = `users/${userId}/busyBlocks`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const blocksList: BusyBlock[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        blocksList.push({
          id: docSnap.id,
          label: data.label || "",
          start: data.start || "",
          end: data.end || "",
        });
      });
      callback(blocksList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError(error);
    }
  );
}

export async function dbSaveBusyBlock(userId: string, block: BusyBlock) {
  const path = `users/${userId}/busyBlocks/${block.id}`;
  try {
    const blockData = {
      id: block.id,
      label: block.label,
      start: block.start,
      end: block.end,
      userId: userId,
    };
    await setDoc(doc(db, "users", userId, "busyBlocks", block.id), blockData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbDeleteBusyBlock(userId: string, blockId: string) {
  const path = `users/${userId}/busyBlocks/${blockId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "busyBlocks", blockId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ------------------ PREFERENCES SYNC ------------------

export function syncPreferences(userId: string, callback: (prefs: SavedPrefs) => void, onError: (err: any) => void) {
  const path = `users/${userId}/preferences/main`;
  return onSnapshot(
    doc(db, "users", userId, "preferences", "main"),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          nvidia_key: sanitizeApiKey(data.nvidia_key),
          ollama_key: sanitizeApiKey(data.ollama_key),
          gemini_key: sanitizeApiKey(data.gemini_key),
          selected_model: data.selected_model || "NIM GPT-120B",
          auto_fallback: data.auto_fallback !== false,
          working_hours_start: data.working_hours_start || "09:00",
          working_hours_end: data.working_hours_end || "17:00",
          timezone: data.timezone || "America/Los_Angeles",
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onError(error);
    }
  );
}

export async function dbSavePreferences(userId: string, prefs: SavedPrefs) {
  const path = `users/${userId}/preferences/main`;
  try {
    const prefsData = {
      ...prefs,
      userId: userId,
    };
    await setDoc(doc(db, "users", userId, "preferences", "main"), prefsData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ------------------ PLANS SYNC ------------------

export function syncPlan(userId: string, callback: (plan: PlanningResponse | null) => void, onError: (err: any) => void) {
  const path = `users/${userId}/plans/current`;
  return onSnapshot(
    doc(db, "users", userId, "plans", "current"),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          date: data.date || "",
          timezone: data.timezone || "",
          model_used_label: data.model_used_label || "",
          priorities: data.priorities || [],
          nudges: data.nudges || [],
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onError(error);
    }
  );
}

export async function dbSavePlan(userId: string, plan: PlanningResponse | null) {
  const path = `users/${userId}/plans/current`;
  try {
    if (!plan) {
      await deleteDoc(doc(db, "users", userId, "plans", "current"));
    } else {
      const planData = {
        ...plan,
        userId: userId,
      };
      await setDoc(doc(db, "users", userId, "plans", "current"), planData);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ------------------ NUDGES SYNC ------------------

export function syncNudges(userId: string, callback: (nudges: any[]) => void, onError: (err: any) => void) {
  const path = `users/${userId}/nudges`;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const nudgesList: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        nudgesList.push({
          id: docSnap.id,
          time: data.time || "",
          title: data.title || "",
          body: data.body || "",
          type: data.type || "",
        });
      });
      // Sort or return list
      callback(nudgesList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError(error);
    }
  );
}

export async function dbSaveNudge(userId: string, nudge: { id: string; time: string; title: string; body: string; type: string }) {
  const path = `users/${userId}/nudges/${nudge.id}`;
  try {
    const nudgeData = {
      ...nudge,
      userId: userId,
    };
    await setDoc(doc(db, "users", userId, "nudges", nudge.id), nudgeData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function dbClearNudges(userId: string) {
  const path = `users/${userId}/nudges`;
  try {
    const querySnapshot = await getDocs(collection(db, "users", userId, "nudges"));
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ------------------ INITIAL DATABASE SEED/IMPORT ------------------

/**
 * Syncs/imports pre-existing localStorage content to Firestore upon first login
 */
export async function importLocalDataToFirestore(
  userId: string,
  localTasks: Task[],
  localHabits: Habit[],
  localBusyBlocks: BusyBlock[],
  localPrefs: SavedPrefs,
  localPlan: PlanningResponse | null,
  localNudges: any[]
) {
  try {
    // 1. Upload User registration profile doc
    const profilePath = `users/${userId}`;
    await setDoc(doc(db, "users", userId), {
      uid: userId,
      email: auth.currentUser?.email || "",
      displayName: auth.currentUser?.displayName || "Rescue User",
      createdAt: new Date().toISOString(),
    });

    // 2. Upload Preferences
    await dbSavePreferences(userId, localPrefs);

    // 3. Upload Plan if present
    if (localPlan) {
      await dbSavePlan(userId, localPlan);
    }

    // 4. Batch upload tasks, habits, busyBlocks, nudges
    const batch = writeBatch(db);

    localTasks.forEach((t) => {
      const taskRef = doc(db, "users", userId, "tasks", t.id);
      batch.set(taskRef, { ...t, userId });
    });

    localHabits.forEach((h) => {
      const habitRef = doc(db, "users", userId, "habits", h.id);
      batch.set(habitRef, { ...h, userId });
    });

    localBusyBlocks.forEach((b) => {
      const blockRef = doc(db, "users", userId, "busyBlocks", b.id);
      batch.set(blockRef, { ...b, userId });
    });

    localNudges.forEach((n) => {
      const nudgeRef = doc(db, "users", userId, "nudges", n.id);
      batch.set(nudgeRef, { ...n, userId });
    });

    await batch.commit();
    console.log("Local offline session data imported to cloud storage successfully!");
  } catch (error) {
    console.error("Local data migration to cloud storage failed:", error);
  }
}
