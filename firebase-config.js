// ══════════════════════════════════════════════════════════════════
//  ACTION PLUMBING — FLEET MAINTENANCE TRACKER
//  firebase-config.js   ·   include BEFORE checklists.js and page scripts
// ══════════════════════════════════════════════════════════════════
//
//  Wired to the dedicated "action-fleet" Firebase project.
//  For a Realtime Database, databaseURL is all the SDK needs to read/write.
//  (apiKey / appId are only required for Auth, Storage, etc. — not used here.
//   If you ever want them, copy them from Firebase → Project Settings → Your apps
//   and paste below.)
//
//  ⚠️ ONE-TIME STEP — SET DATABASE RULES, or every read/write will fail:
//  Firebase Console → Realtime Database → Rules tab → paste this → Publish:
//
//      {
//        "rules": {
//          ".read": true,
//          ".write": true
//        }
//      }
//
//  (That makes the DB readable/writable by anyone with the URL — same posture
//   as an internal tool. Fine to start; can be locked down later with Auth.)
// ══════════════════════════════════════════════════════════════════

const firebaseConfig = {
    databaseURL: "https://action-fleet-default-rtdb.firebaseio.com",
    projectId:   "action-fleet",
    authDomain:  "action-fleet.firebaseapp.com"
    // apiKey:   "…",   // optional — not needed for Realtime Database
    // appId:    "…"    // optional
};

// ── init (uses the compat SDK loaded in each HTML <head>) ────────────
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Everything lives under this root so it can share a project with other apps.
const FLEET_ROOT = 'fleet';
function fleetRef(path) { return db.ref(FLEET_ROOT + (path ? '/' + path : '')); }
