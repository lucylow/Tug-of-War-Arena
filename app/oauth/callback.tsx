import { ThemedView } from "@/components/themed-view";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

import {
  decodeOAuthUserPayload,
  parseOAuthFallbackParams,
  readOAuthErrorParam,
  readSingleSearchParam,
} from "@/lib/oauth-params";
import { resolveOAuthCallbackOutcome } from "@/lib/oauth-flow";
import { SafeAreaView } from "react-native-safe-area-context";

async function storeDecodedUser(encoded: string | null): Promise<void> {
  if (!encoded) return;
  const user = Auth.parseStoredUser(decodeOAuthUserPayload(encoded));
  if (!user) {
    console.error("[OAuth] Failed to parse user data");
    return;
  }
  await Auth.setUserInfo(user);
  console.log("[OAuth] User info stored:", user);
}

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    state?: string | string[];
    error?: string | string[];
    sessionToken?: string | string[];
    user?: string | string[];
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    const fail = (message: string) => {
      if (cancelled) return;
      setStatus("error");
      setErrorMessage(message);
    };

    const succeed = () => {
      if (cancelled) return;
      setStatus("success");
      redirectTimer = setTimeout(() => {
        if (!cancelled) router.replace("/(tabs)");
      }, 1000);
    };

    const handleCallback = async () => {
      const codeParam = readSingleSearchParam(params.code);
      const stateParam = readSingleSearchParam(params.state);
      const errorParam = readSingleSearchParam(params.error);
      const sessionTokenParam = readSingleSearchParam(params.sessionToken);
      const userParam = readSingleSearchParam(params.user);

      console.log("[OAuth] Callback handler triggered");
      console.log("[OAuth] Params received:", {
        code: codeParam,
        state: stateParam,
        error: errorParam,
        sessionToken: sessionTokenParam ? "present" : "missing",
        user: userParam ? "present" : "missing",
      });

      try {
        if (sessionTokenParam) {
          console.log("[OAuth] Session token found in params (web callback)");
          await Auth.setSessionToken(sessionTokenParam);
          await storeDecodedUser(userParam);
          console.log("[OAuth] Web authentication successful, redirecting to home...");
          succeed();
          return;
        }

        let url: string | null = null;

        if (codeParam || stateParam || errorParam) {
          console.log("[OAuth] Found params in route params");
          const urlParams = new URLSearchParams();
          if (codeParam) urlParams.set("code", codeParam);
          if (stateParam) urlParams.set("state", stateParam);
          if (errorParam) urlParams.set("error", errorParam);
          url = `?${urlParams.toString()}`;
          console.log("[OAuth] Constructed URL from params:", url);
        } else {
          console.log("[OAuth] No params found, checking Linking.getInitialURL()...");
          try {
            const initialUrl = await Linking.getInitialURL();
            console.log("[OAuth] Linking.getInitialURL():", initialUrl);
            if (initialUrl) url = initialUrl;
          } catch (linkError) {
            console.error("[OAuth] Failed to read the initial URL:", linkError);
          }
        }

        if (cancelled) return;

        const error = errorParam || readOAuthErrorParam(url);
        let code: string | null = null;
        let state: string | null = null;
        let sessionToken: string | null = null;

        if (codeParam && stateParam) {
          console.log("[OAuth] Using code and state from route params");
          code = codeParam;
          state = stateParam;
        } else if (url) {
          console.log("[OAuth] Parsing code and state from URL:", url);
          try {
            const urlObj = new URL(url);
            code = urlObj.searchParams.get("code");
            state = urlObj.searchParams.get("state");
            sessionToken = urlObj.searchParams.get("sessionToken");
          } catch (e) {
            console.log("[OAuth] Failed to parse as full URL, trying regex:", e);
            const fallbackParams = parseOAuthFallbackParams(url);
            code = fallbackParams.code ?? null;
            state = fallbackParams.state ?? null;
            sessionToken = fallbackParams.sessionToken ?? null;
          }
        }

        const outcome = resolveOAuthCallbackOutcome({ error, sessionToken, code, state });

        if (outcome.kind === "error") {
          console.error("[OAuth] Error parameter found:", outcome.message);
          fail(outcome.message);
          return;
        }

        if (outcome.kind === "session-token") {
          console.log("[OAuth] Session token found in URL, storing...");
          await Auth.setSessionToken(outcome.sessionToken);
          await storeDecodedUser(userParam);
          succeed();
          return;
        }

        if (outcome.kind === "missing-parameters") {
          console.error("[OAuth] Missing code or state parameter", {
            hasCode: !!code,
            hasState: !!state,
          });
          fail(outcome.message);
          return;
        }

        const result = await Api.exchangeOAuthCode(outcome.code, outcome.state);
        if (!result.sessionToken) {
          console.error("[OAuth] No session token in result:", result);
          fail("No session token received");
          return;
        }

        await Auth.setSessionToken(result.sessionToken);
        const exchangedUser = Auth.parseStoredUser(result.user);
        if (exchangedUser) {
          await Auth.setUserInfo(exchangedUser);
        } else if (result.user) {
          console.error("[OAuth] Exchange returned malformed user data");
        }

        succeed();
      } catch (error) {
        console.error("[OAuth] Callback error:", error);
        fail(error instanceof Error ? error.message : "Failed to complete authentication");
      }
    };

    handleCallback();
    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [params.code, params.state, params.error, params.sessionToken, params.user, router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">
              Completing authentication...
            </Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text className="text-base leading-6 text-center text-foreground">
              Authentication successful!
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              Redirecting...
            </Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              Authentication failed
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              {errorMessage}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to Arena Home"
              accessibilityHint="Leaves the failed sign-in screen and returns to the arena"
              onPress={() => router.replace("/(tabs)")}
              className="mt-4 min-h-[54px] items-center justify-center rounded-2xl bg-[#FFC857] px-5"
            >
              <Text className="text-sm font-bold text-[#171A4A]">Return to Arena Home</Text>
            </Pressable>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
