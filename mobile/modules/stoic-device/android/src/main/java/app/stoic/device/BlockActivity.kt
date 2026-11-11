package app.stoic.device

import android.app.Activity
import android.content.Intent
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.CountDownTimer
import android.text.format.DateFormat
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.window.OnBackInvokedDispatcher
import androidx.core.content.res.ResourcesCompat
import java.util.Date

/**
 * The full-screen card shown in front of an app: a pause, a "time's up",
 * or a "you're in a focus session" message.
 *
 * Tone rules: supportive, never shaming. Built from plain Android views so
 * it opens instantly and works with TalkBack and large fonts.
 */
class BlockActivity : Activity() {
  // STOIC's own fonts (same as the app: Fredoka for headings and buttons, Nunito for text).
  // Fall back to the system font if they cannot be loaded.
  private val displayFont: Typeface by lazy {
    ResourcesCompat.getFont(this, R.font.stoic_fredoka_bold) ?: Typeface.DEFAULT_BOLD
  }
  private val bodyFont: Typeface by lazy {
    ResourcesCompat.getFont(this, R.font.stoic_nunito_regular) ?: Typeface.DEFAULT
  }

  private var countdown: CountDownTimer? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    render(intent)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      // Back means "leave the app", not "slip past this screen".
      onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) { goHome() }
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    render(intent)
  }

  @Deprecated("Deprecated in Java")
  override fun onBackPressed() = goHome()

  private fun render(intent: Intent) {
    countdown?.cancel()
    val store = Store(this)
    val kind = try { Decision.valueOf(intent.getStringExtra(EXTRA_KIND) ?: "") } catch (_: Exception) { Decision.PAUSE }
    val pkg = intent.getStringExtra(EXTRA_PACKAGE) ?: ""
    val label = intent.getStringExtra(EXTRA_LABEL) ?: getString(R.string.stoic_this_app)
    val limitMin = intent.getIntExtra(EXTRA_LIMIT_MIN, 0)
    val allowExtend = intent.getBooleanExtra(EXTRA_ALLOW_EXTEND, true)
    val focusUntil = intent.getLongExtra(EXTRA_FOCUS_UNTIL, 0)

    val titleText: String
    val bodyText: String
    when (kind) {
      Decision.FOCUS -> {
        titleText = getString(R.string.stoic_focus_title)
        bodyText = getString(R.string.stoic_focus_body, label, DateFormat.getTimeFormat(this).format(Date(focusUntil)))
      }
      Decision.LIMIT -> {
        titleText = getString(R.string.stoic_limit_title)
        bodyText = getString(R.string.stoic_limit_body, limitMin, label)
      }
      Decision.SCHEDULE -> {
        val name = intent.getStringExtra(EXTRA_SCHEDULE_NAME) ?: getString(R.string.stoic_schedule_fallback)
        titleText = if (intent.getBooleanExtra(EXTRA_SCHEDULE_BEDTIME, false)) getString(R.string.stoic_bedtime_title)
        else getString(R.string.stoic_schedule_title, name)
        bodyText = getString(R.string.stoic_schedule_body, label, endTimeText(intent.getIntExtra(EXTRA_SCHEDULE_END_MIN, 0)))
      }
      else -> {
        titleText = getString(R.string.stoic_pause_title)
        bodyText = getString(R.string.stoic_pause_body, label)
      }
    }
    title = titleText // announced by TalkBack when the screen opens

    val pad = dp(24)
    val column = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(pad, dp(48), pad, pad)
    }

    column.addView(ImageView(this).apply {
      setImageResource(R.drawable.stoic_pebble)
      importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }, LinearLayout.LayoutParams(dp(150), dp(123)))

    column.addView(TextView(this).apply {
      text = titleText
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
      typeface = displayFont
      setTextColor(getColor(R.color.stoic_ink))
      gravity = Gravity.CENTER
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) isAccessibilityHeading = true
    }, margin(top = 24))

    column.addView(TextView(this).apply {
      text = bodyText
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
      typeface = bodyFont
      setLineSpacing(0f, 1.3f)
      setTextColor(getColor(R.color.stoic_ink))
      gravity = Gravity.CENTER
    }, margin(top = 12))

    // Primary action is always the gentle way out.
    column.addView(button(getString(R.string.stoic_go_back), primary = true) { goHome() }, margin(top = 32))

    when (kind) {
      Decision.PAUSE -> {
        val open = button(getString(R.string.stoic_open_anyway_wait), primary = false) {
          store.setGraceUntil(pkg, System.currentTimeMillis() + Blocker.GRACE_MS)
          finish()
        }
        open.isEnabled = false
        open.alpha = 0.5f
        column.addView(open, margin(top = 12))
        countdown = object : CountDownTimer(PAUSE_MS, 1_000) {
          override fun onTick(left: Long) {
            // Visible countdown; the spoken label stays stable so TalkBack does not repeat every second.
            open.text = getString(R.string.stoic_open_anyway_in, (left / 1000 + 1).toInt())
            open.contentDescription = getString(R.string.stoic_open_anyway_wait)
          }

          override fun onFinish() {
            open.text = getString(R.string.stoic_open_anyway)
            open.contentDescription = null
            open.isEnabled = true
            open.alpha = 1f
            open.announceForAccessibility(getString(R.string.stoic_open_anyway_ready))
          }
        }.start()
      }
      Decision.LIMIT -> if (allowExtend) {
        column.addView(button(getString(R.string.stoic_five_more), primary = false) {
          store.setExtendUntil(pkg, System.currentTimeMillis() + Blocker.EXTEND_MS)
          finish()
        }, margin(top = 12))
      }
      Decision.SCHEDULE -> if (intent.getBooleanExtra(EXTRA_SCHEDULE_SNOOZE, false)) {
        column.addView(button(getString(R.string.stoic_five_more), primary = false) {
          store.setSnoozeUntil(pkg, System.currentTimeMillis() + Blocker.EXTEND_MS)
          finish()
        }, margin(top = 12))
      }
      else -> {}
    }

    column.addView(TextView(this).apply {
      text = getString(R.string.stoic_footer)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
      typeface = bodyFont
      setTextColor(getColor(R.color.stoic_muted))
      gravity = Gravity.CENTER
    }, margin(top = 28))

    setContentView(ScrollView(this).apply {
      setBackgroundColor(getColor(R.color.stoic_bg))
      isFillViewport = true
      fitsSystemWindows = true
      addView(column, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
    })
  }

  private fun button(label: String, primary: Boolean, onClick: () -> Unit) = Button(this).apply {
    text = label
    isAllCaps = false
    setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
    typeface = displayFont
    minHeight = dp(52)
    minimumHeight = dp(52)
    setPadding(dp(24), dp(10), dp(24), dp(10))
    stateListAnimator = null
    setTextColor(getColor(if (primary) R.color.stoic_brand_ink else R.color.stoic_ink))
    background = GradientDrawable().apply {
      cornerRadius = dp(28).toFloat()
      if (primary) setColor(getColor(R.color.stoic_brand))
      else {
        setColor(getColor(R.color.stoic_surface))
        setStroke(dp(2), getColor(R.color.stoic_field))
      }
    }
    setOnClickListener { onClick() }
  }

  private fun margin(top: Int) = LinearLayout.LayoutParams(
    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
  ).apply { topMargin = dp(top) }

  /** "7:00 AM" (or "07:00") for a schedule that ends this many minutes after midnight. */
  private fun endTimeText(endMin: Int): String {
    val c = java.util.Calendar.getInstance().apply {
      set(java.util.Calendar.HOUR_OF_DAY, endMin / 60)
      set(java.util.Calendar.MINUTE, endMin % 60)
    }
    return DateFormat.getTimeFormat(this).format(c.time)
  }

  private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

  /** Leave the blocked app by going to the home screen. */
  private fun goHome() {
    startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    finish()
  }

  override fun onDestroy() {
    countdown?.cancel()
    super.onDestroy()
  }

  companion object {
    const val EXTRA_KIND = "kind"
    const val EXTRA_PACKAGE = "package"
    const val EXTRA_LABEL = "label"
    const val EXTRA_LIMIT_MIN = "limitMin"
    const val EXTRA_ALLOW_EXTEND = "allowExtend"
    const val EXTRA_FOCUS_UNTIL = "focusUntil"
    const val EXTRA_SCHEDULE_NAME = "scheduleName"
    const val EXTRA_SCHEDULE_BEDTIME = "scheduleBedtime"
    const val EXTRA_SCHEDULE_END_MIN = "scheduleEndMin"
    const val EXTRA_SCHEDULE_SNOOZE = "scheduleSnooze"
    private const val PAUSE_MS = 10_000L
  }
}
