package com.example.chat_app1

import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "app.usage.channel"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "getUsageStats" -> {
                    val start = call.argument<Long>("start") ?: 0L
                    val end = call.argument<Long>("end") ?: System.currentTimeMillis()
                    val usageStats = getUsageStats(start, end)
                    result.success(usageStats)
                }
                "openUsageSettings" -> {
                    openUsageSettings()
                    result.success(null)
                }
                "hasUsagePermission" -> {
                    val appOps = getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
                    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        appOps.unsafeCheckOpNoThrow(
                            android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
                            android.os.Process.myUid(),
                            packageName
                        )
                    } else {
                        appOps.checkOpNoThrow(
                            android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
                            android.os.Process.myUid(),
                            packageName
                        )
                    }
                    result.success(mode == android.app.AppOpsManager.MODE_ALLOWED)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun getUsageStats(start: Long, end: Long): List<Map<String, Any>> {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end)
        return stats.map {
            mapOf(
                "packageName" to it.packageName,
                "lastTimeUsed" to it.lastTimeUsed,
                "totalTimeInForeground" to it.totalTimeInForeground
            )
        }
    }

    private fun openUsageSettings() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }
}