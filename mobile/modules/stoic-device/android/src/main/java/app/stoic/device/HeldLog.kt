package app.stoic.device

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Notifications STOIC is holding for later, and how many notifications each app sent per day.
 * Stored only in STOIC's private storage on this phone. Held items are deleted when the user
 * opens or clears them, or after MAX_AGE_MS.
 */
object HeldLog {
  private const val FILE = "notifications.json"
  private const val MAX_ITEMS = 300
  private const val MAX_AGE_MS = 3 * 24 * 60 * 60_000L
  private const val MAX_COUNT_DAYS = 14

  data class Item(
    val key: String,
    val pkg: String,
    val label: String,
    val title: String,
    val text: String,
    val postedAt: Long,
    /** "app": the user holds this app. "blocked": held because the app was blocked at the time. */
    val reason: String,
  )

  private fun file(context: Context) = File(context.filesDir, FILE)

  @Synchronized
  private fun read(context: Context): JSONObject {
    val f = file(context)
    val root = try {
      if (f.exists()) JSONObject(f.readText()) else JSONObject()
    } catch (_: Exception) {
      JSONObject()
    }
    if (!root.has("items")) root.put("items", JSONArray())
    if (!root.has("counts")) root.put("counts", JSONObject())
    return root
  }

  @Synchronized
  private fun write(context: Context, root: JSONObject) {
    val tmp = File(context.filesDir, "$FILE.tmp")
    tmp.writeText(root.toString())
    if (!tmp.renameTo(file(context))) {
      file(context).writeText(root.toString())
      tmp.delete()
    }
  }

  @Synchronized
  fun count(context: Context, day: String, pkg: String) {
    val root = read(context)
    val counts = root.getJSONObject("counts")
    val d = counts.optJSONObject(day) ?: JSONObject().also { counts.put(day, it) }
    d.put(pkg, d.optInt(pkg, 0) + 1)
    counts.keys().asSequence().toList().sorted().dropLast(MAX_COUNT_DAYS).forEach { counts.remove(it) }
    write(context, root)
  }

  @Synchronized
  fun add(context: Context, item: Item) {
    val root = read(context)
    val now = System.currentTimeMillis()
    // Keep one entry per notification key: a chat that updates its notification replaces the old one.
    val kept = items(root).filter { it.key != item.key && now - it.postedAt < MAX_AGE_MS }.takeLast(MAX_ITEMS - 1)
    root.put("items", toJson(kept + item))
    write(context, root)
  }

  @Synchronized
  fun list(context: Context): List<Item> {
    val now = System.currentTimeMillis()
    return items(read(context)).filter { now - it.postedAt < MAX_AGE_MS }
  }

  @Synchronized
  fun remove(context: Context, key: String) {
    val root = read(context)
    root.put("items", toJson(items(root).filter { it.key != key }))
    write(context, root)
  }

  @Synchronized
  fun clear(context: Context) {
    val root = read(context)
    root.put("items", JSONArray())
    write(context, root)
  }

  @Synchronized
  fun countsFor(context: Context, day: String): Map<String, Int> {
    val d = read(context).getJSONObject("counts").optJSONObject(day) ?: return emptyMap()
    return d.keys().asSequence().associateWith { d.optInt(it) }
  }

  private fun items(root: JSONObject): List<Item> {
    val arr = root.getJSONArray("items")
    return (0 until arr.length()).mapNotNull { i ->
      val o = arr.optJSONObject(i) ?: return@mapNotNull null
      Item(
        o.optString("key"), o.optString("packageName"), o.optString("label"), o.optString("title"),
        o.optString("text"), o.optLong("postedAt"), o.optString("reason", "app"),
      )
    }
  }

  fun toJson(list: List<Item>): JSONArray {
    val arr = JSONArray()
    list.forEach {
      arr.put(
        JSONObject().put("key", it.key).put("packageName", it.pkg).put("label", it.label).put("title", it.title)
          .put("text", it.text).put("postedAt", it.postedAt).put("reason", it.reason),
      )
    }
    return arr
  }
}
