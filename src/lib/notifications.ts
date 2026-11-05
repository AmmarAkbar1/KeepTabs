import { 
  isPermissionGranted, 
  requestPermission, 
  sendNotification 
} from "@tauri-apps/plugin-notification";

export async function notify(title: string, body: string) {
  try {
    let permissionGranted = await isPermissionGranted();

    // If permission hasn't been granted yet, ask the user
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    // Send the native desktop/mobile notification
    if (permissionGranted) {
      sendNotification({
        title: title,
        body: body,
      });
    }
  } catch (err) {
    console.error("Notification error:", err);
  }
}