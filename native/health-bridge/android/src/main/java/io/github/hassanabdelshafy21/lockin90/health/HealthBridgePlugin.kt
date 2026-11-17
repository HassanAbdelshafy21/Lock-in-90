package io.github.hassanabdelshafy21.lockin90.health

import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.aggregate.AggregateMetric
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BodyTemperatureRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.Period
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import kotlin.reflect.KClass

/**
 * Read-only bridge to Android Health Connect.
 *
 * JS: Capacitor.Plugins.HealthBridge
 *   status()               -> { available: "yes"|"update"|"no", granted: [type…] }
 *   connect()              -> opens the Health Connect permission screen, then returns status()
 *   read({ start, end })   -> raw data for local dates start..end (inclusive), max 35 days
 *   openSettings()         -> Health Connect settings (or its Play Store page if missing/outdated)
 *
 * The app does the daily summarising in JS, so the rules live in one place and can be tested.
 */
@CapacitorPlugin(name = "HealthBridge")
class HealthBridgePlugin : Plugin() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    /** Short names used on the JS side -> Health Connect record types. */
    private val types: Map<String, KClass<out Record>> = linkedMapOf(
        "steps" to StepsRecord::class,
        "activeKcal" to ActiveCaloriesBurnedRecord::class,
        "totalKcal" to TotalCaloriesBurnedRecord::class,
        "exercise" to ExerciseSessionRecord::class,
        "sleep" to SleepSessionRecord::class,
        "hr" to HeartRateRecord::class,
        "hrv" to HeartRateVariabilityRmssdRecord::class,
        "rhr" to RestingHeartRateRecord::class,
        "spo2" to OxygenSaturationRecord::class,
        "temp" to BodyTemperatureRecord::class,
    )
    private val permissions: Set<String> by lazy { types.values.map { HealthPermission.getReadPermission(it) }.toSet() }

    private fun sdkStatus(): Int = HealthConnectClient.getSdkStatus(context, PROVIDER)
    private fun client(): HealthConnectClient = HealthConnectClient.getOrCreate(context)

    private suspend fun grantedTypes(): List<String> {
        val granted = client().permissionController.getGrantedPermissions()
        return types.filter { granted.contains(HealthPermission.getReadPermission(it.value)) }.keys.toList()
    }

    @PluginMethod
    fun status(call: PluginCall) {
        val sdk = sdkStatus()
        val ret = JSObject()
        ret.put("available", when (sdk) {
            HealthConnectClient.SDK_AVAILABLE -> "yes"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update"
            else -> "no"
        })
        if (sdk != HealthConnectClient.SDK_AVAILABLE) {
            ret.put("granted", JSArray())
            call.resolve(ret)
            return
        }
        scope.launch {
            try {
                ret.put("granted", JSArray(grantedTypes()))
                call.resolve(ret)
            } catch (e: Exception) {
                call.reject(e.message ?: "Couldn't check Health Connect permissions", "STATUS_FAILED", e)
            }
        }
    }

    // Named connect (not requestPermissions) because Plugin already has a requestPermissions method.
    @PluginMethod
    fun connect(call: PluginCall) {
        if (sdkStatus() != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect isn't installed or needs an update", "UNAVAILABLE")
            return
        }
        val intent = PermissionController.createRequestPermissionResultContract().createIntent(context, permissions)
        startActivityForResult(call, intent, "onPermissionResult")
    }

    @ActivityCallback
    private fun onPermissionResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        status(call) // report what was actually granted; the user may tick only some types
    }

    @PluginMethod
    fun openSettings(call: PluginCall) {
        val intent = if (sdkStatus() == HealthConnectClient.SDK_AVAILABLE) {
            Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
        } else {
            Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$PROVIDER&url=healthconnect%3A%2F%2Fonboarding"))
                .setPackage("com.android.vending")
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            context.startActivity(intent)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Couldn't open Health Connect", "OPEN_FAILED", e)
        }
    }

    @PluginMethod
    fun read(call: PluginCall) {
        val startStr = call.getString("start")
        val endStr = call.getString("end")
        if (startStr == null || endStr == null) {
            call.reject("start and end (YYYY-MM-DD) are required", "BAD_ARGS"); return
        }
        val zone = ZoneId.systemDefault()
        val (start, end) = try {
            Pair(LocalDate.parse(startStr), LocalDate.parse(endStr))
        } catch (e: Exception) {
            call.reject("Dates must be YYYY-MM-DD", "BAD_ARGS"); return
        }
        if (end.isBefore(start) || ChronoUnit.DAYS.between(start, end) > 34) {
            call.reject("Range must be 1 to 35 days", "BAD_ARGS"); return
        }
        if (sdkStatus() != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect isn't available", "UNAVAILABLE"); return
        }

        scope.launch {
            try {
                val granted = grantedTypes().toSet()
                // Records: one day wider on each side so a night's sleep that starts the evening before is included.
                val from = start.minusDays(1).atStartOfDay(zone).toInstant()
                val to = end.plusDays(1).atStartOfDay(zone).toInstant()
                val ret = JSObject()
                ret.put("zone", zone.id)
                ret.put("start", startStr)
                ret.put("end", endStr)
                ret.put("granted", JSArray(granted.toList()))
                ret.put("days", dailyAggregates(start, end, granted))

                ret.put("sleep", if ("sleep" in granted) JSArray(readAll(SleepSessionRecord::class, from, to).map { r ->
                    val o = interval(r.startTime, r.endTime, r.metadata.dataOrigin.packageName)
                    r.title?.let { o.put("title", it) }
                    o.put("stages", JSArray(r.stages.map { st ->
                        JSObject().apply {
                            put("s", st.startTime.toEpochMilli()); put("e", st.endTime.toEpochMilli()); put("stage", st.stage)
                        }
                    }))
                    o
                }) else JSArray())

                ret.put("hrv", if ("hrv" in granted) JSArray(readAll(HeartRateVariabilityRmssdRecord::class, from, to).map { r ->
                    point(r.time, r.metadata.dataOrigin.packageName).apply { put("ms", r.heartRateVariabilityMillis) }
                }) else JSArray())

                ret.put("rhr", if ("rhr" in granted) JSArray(readAll(RestingHeartRateRecord::class, from, to).map { r ->
                    point(r.time, r.metadata.dataOrigin.packageName).apply { put("bpm", r.beatsPerMinute) }
                }) else JSArray())

                ret.put("spo2", if ("spo2" in granted) JSArray(readAll(OxygenSaturationRecord::class, from, to).map { r ->
                    point(r.time, r.metadata.dataOrigin.packageName).apply { put("pct", r.percentage.value) }
                }) else JSArray())

                ret.put("temp", if ("temp" in granted) JSArray(readAll(BodyTemperatureRecord::class, from, to).map { r ->
                    point(r.time, r.metadata.dataOrigin.packageName).apply {
                        put("c", r.temperature.inCelsius); put("loc", r.measurementLocation)
                    }
                }) else JSArray())

                ret.put("exercise", if ("exercise" in granted) JSArray(readAll(ExerciseSessionRecord::class, from, to).map { r ->
                    val o = interval(r.startTime, r.endTime, r.metadata.dataOrigin.packageName)
                    o.put("type", r.exerciseType)
                    r.title?.let { o.put("title", it) }
                    o
                }) else JSArray())

                call.resolve(ret)
            } catch (e: SecurityException) {
                call.reject("A Health Connect permission was removed. Connect again.", "PERMISSION", e)
            } catch (e: Exception) {
                call.reject(e.message ?: "Couldn't read Health Connect", "READ_FAILED", e)
            }
        }
    }

    /** Per local day: steps, calories and heart-rate stats. Health Connect de-duplicates phone + band data here. */
    private suspend fun dailyAggregates(start: LocalDate, end: LocalDate, granted: Set<String>): JSArray {
        val metrics = mutableSetOf<AggregateMetric<*>>()
        if ("steps" in granted) metrics += StepsRecord.COUNT_TOTAL
        if ("activeKcal" in granted) metrics += ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL
        if ("totalKcal" in granted) metrics += TotalCaloriesBurnedRecord.ENERGY_TOTAL
        if ("hr" in granted) { metrics += HeartRateRecord.BPM_AVG; metrics += HeartRateRecord.BPM_MIN; metrics += HeartRateRecord.BPM_MAX }
        if (metrics.isEmpty()) return JSArray()
        val groups = client().aggregateGroupByPeriod(
            AggregateGroupByPeriodRequest(
                metrics = metrics,
                timeRangeFilter = TimeRangeFilter.between(start.atStartOfDay(), end.plusDays(1).atStartOfDay()),
                timeRangeSlicer = Period.ofDays(1),
            )
        )
        val out = JSArray()
        for (g in groups) {
            val r = g.result
            val o = JSObject()
            o.put("date", g.startTime.toLocalDate().toString())
            r[StepsRecord.COUNT_TOTAL]?.let { o.put("steps", it) }
            r[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let { o.put("activeKcal", it.inKilocalories) }
            r[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.let { o.put("totalKcal", it.inKilocalories) }
            r[HeartRateRecord.BPM_AVG]?.let { o.put("hrAvg", it) }
            r[HeartRateRecord.BPM_MIN]?.let { o.put("hrMin", it) }
            r[HeartRateRecord.BPM_MAX]?.let { o.put("hrMax", it) }
            o.put("origins", JSArray(r.dataOrigins.map { it.packageName }))
            out.put(o)
        }
        return out
    }

    private suspend fun <T : Record> readAll(type: KClass<T>, from: Instant, to: Instant): List<T> {
        val out = mutableListOf<T>()
        var token: String? = null
        do {
            val res = client().readRecords(
                ReadRecordsRequest(
                    recordType = type,
                    timeRangeFilter = TimeRangeFilter.between(from, to),
                    pageSize = 1000,
                    pageToken = token,
                )
            )
            out += res.records
            token = res.pageToken
        } while (token != null)
        return out
    }

    private fun point(t: Instant, src: String) = JSObject().apply { put("t", t.toEpochMilli()); put("src", src) }
    private fun interval(s: Instant, e: Instant, src: String) =
        JSObject().apply { put("s", s.toEpochMilli()); put("e", e.toEpochMilli()); put("src", src) }

    override fun handleOnDestroy() {
        scope.cancel()
        super.handleOnDestroy()
    }

    companion object {
        private const val PROVIDER = "com.google.android.apps.healthdata"
    }
}
