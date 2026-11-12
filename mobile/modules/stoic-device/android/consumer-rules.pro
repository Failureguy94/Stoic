# Keep rules shipped with STOIC's native module, applied whenever an app using it is shrunk (release builds).

# WorkManager (the background screen-time record) creates its Room database by reflection.
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class androidx.work.impl.WorkDatabase_Impl { *; }
-keep class * extends androidx.work.ListenableWorker { <init>(android.content.Context, androidx.work.WorkerParameters); }

# Services, activities and receivers named in the manifest, plus the Expo module class.
-keep class app.stoic.device.** { *; }
