# STOIC on a real phone: test checklist

Use this with the test APK (`stoic-test.apk`). Tick each line, and note the phone model and Android version.

**Phone:** ______________________ **Android version:** ________ **Date:** ________

## Install

- [ ] Copy `stoic-test.apk` to the phone and open it. Allow "Install unknown apps" for your file manager if asked.
- [ ] STOIC opens on the **Today** tab, and the **Set up** card is shown.

## Permissions (Today → Set up)

- [ ] **Usage access** switches on, and **My screen time** shows today's apps.
- [ ] **Accessibility → STOIC limits and pauses** switches on. If Android says *Restricted setting*: Settings → Apps → STOIC → ⋮ → **Allow restricted settings**, then try again.

## Limits and pauses

- [ ] Add Instagram or YouTube with **Pause before opening**: opening it shows the 10-second pause; **Open anyway** works.
- [ ] Set a **15 min daily limit**: after 15 minutes in the app, "That's your time for today" appears.
- [ ] **Opens per day: 5**: the 6th open shows "That's your opens for today".

## Shorts and Reels (the part that can only be checked on a real phone)

- [ ] Controls → **Shorts and Reels**: switch on YouTube Shorts, then switch on **STOIC Shorts and Reels blocker** under Accessibility.
- [ ] In YouTube, open a Short: STOIC goes back and shows "STOIC closed Shorts".
- [ ] Normal YouTube videos, search and the home feed still work.
- [ ] Same for Instagram Reels, if you use Instagram. Feed, stories and messages still work.

## Bedtime, focus, notifications, websites

- [ ] Bedtime set to start in 2 minutes: when it starts, a blocked app shows "It's bedtime". Phone, messages and alarms still open.
- [ ] Focus tab: start 15 minutes with **Block my chosen apps** on: those apps are blocked until it ends.
- [ ] Notifications: allow Notification access, **Hold** a chatty app: its notifications go to STOIC and arrive in the summary.
- [ ] Websites: allow the VPN, block YouTube: youtube.com doesn't open in Chrome; other sites do.
- [ ] Strict mode for 1 hour: removing an app's limit is refused; uninstalling apps is blocked.

## The important one: does it keep working?

Battery savers on many phones stop apps like STOIC in the background.

- [ ] After **a full day** of normal use, pauses and limits still appear.
- [ ] After **restarting the phone**, pauses still appear without opening STOIC first. (If not: check Accessibility, and on Xiaomi/Redmi turn on **Autostart** and set **Battery saver → No restrictions** for STOIC.)

## Anything odd

Write down what you did, what you expected and what happened, plus a screenshot if you can.
