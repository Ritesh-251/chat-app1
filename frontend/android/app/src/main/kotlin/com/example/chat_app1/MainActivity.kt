package com.example.chat_app1

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val CHANNEL = "app.usage.channel"
    private val TAG = "UsageChannel"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {

                "hasUsagePermission" -> {
                    try {
                        result.success(hasUsageAccess())
                    } catch (e: Exception) {
                        Log.e(TAG, "hasUsagePermission error", e)
                        result.error("PERM_CHECK_FAILED", e.message, null)
                    }
                }

                "openUsageSettings" -> {
                    try {
                        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        startActivity(intent)
                        result.success(null)
                    } catch (e: Exception) {
                        Log.e(TAG, "openUsageSettings failed", e)
                        result.error("OPEN_SETTINGS_FAILED", e.message, null)
                    }
                }

                "getUsageStats" -> {
                    // Use Number -> toLong() for robust handling of int/long from Dart
                    val start = call.argument<Number>("start")?.toLong()
                    val end = call.argument<Number>("end")?.toLong()
                    if (start == null || end == null) {
                        result.error("BAD_ARGS", "Missing 'start' or 'end' arguments", null)
                        return@setMethodCallHandler
                    }

                    try {
                        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
                        val stats = usm.queryUsageStats(
                            UsageStatsManager.INTERVAL_DAILY,
                            start,
                            end
                        )

                        val payload = stats.map { s ->
                            mapOf(
                                "packageName" to s.packageName,
                                "totalTimeInForeground" to s.totalTimeInForeground, // ms
                                "lastTimeUsed" to s.lastTimeUsed // epoch ms
                            )
                        }
                        result.success(payload)
                    } catch (e: Exception) {
                        Log.e(TAG, "queryUsageStats failed", e)
                        result.error("QUERY_FAILED", e.message, null)
                    }
                }

                else -> result.notImplemented()
            }
        }
    }

    private fun hasUsageAccess(): Boolean {
        return try {
            val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    appOps.unsafeCheckOpNoThrow(
                        AppOpsManager.OPSTR_GET_USAGE_STATS,
                        android.os.Process.myUid(),
                        packageName
                    )
                } else {
                    appOps.checkOpNoThrow(
                        AppOpsManager.OPSTR_GET_USAGE_STATS,
                        android.os.Process.myUid(),
                        packageName
                    )
                }
            mode == AppOpsManager.MODE_ALLOWED
        } catch (e: Exception) {
            Log.e(TAG, "hasUsageAccess check failed", e)
            false
        }
    }
}
