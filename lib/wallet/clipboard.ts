import * as Clipboard from "expo-clipboard";

export async function copyWalletAddress(address: string): Promise<{ ok: boolean; message: string }> {
  try {
    await Clipboard.setStringAsync(address);
    return { ok: true, message: "Address copied" };
  } catch {
    return { ok: false, message: "Clipboard unavailable" };
  }
}
