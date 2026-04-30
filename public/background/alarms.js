// 通知のスケジュール管理を専任するモジュール

export async function setupAlarm() {
  const { isNotifyEnabled, notifyTime } = await chrome.storage.local.get([
    "isNotifyEnabled",
    "notifyTime",
  ]);

  await chrome.alarms.clear("dailyPop");

  if (isNotifyEnabled && notifyTime) {
    const [hours, minutes] = notifyTime.split(":").map(Number);
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
    );

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    chrome.alarms.create("dailyPop", {
      when: scheduledTime.getTime(),
      periodInMinutes: 1440,
    });
    console.log(`Alarm set for: ${scheduledTime}`);
  }
}
