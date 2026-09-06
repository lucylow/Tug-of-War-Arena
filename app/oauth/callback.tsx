import { ThemedView } from "@/components/themed-view";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";

import { parseOAuthFallbackParams, readOAuthErrorParam } from "@/lib/oauth-params";
import { resolveOAuthCallbackOutcome } from "@/lib/oauth-flow";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    sessionToken?: string;
    user?: string;
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[OAuth] Callback handler triggered");
      console.log("[OAuth] Params received:", {
        code: params.code,
        state: params.state,
        error: params.error,
        sessionToken: params.sessionToken ? "present" : "missing",
        user: params.user ? "present" : "missing",
      });
      try {
        // Check for sessionToken in params first (web OAuth callback from server redirect)
        if (params.sessionToken) {
          console.log("[OAuth] Session token found in params (web callback)");
          await Auth.setSessionToken(params.sessionToken);

          // Decode and store user info if available
          if (params.user) {
            try {
              // Use atob for base64 decoding (works in both web and React Native)
              const userJson =
                typeof atob !== "undefined"
                  ? atob(params.user)
                  : Buffer.from(params.user, "base64").toString("utf-8");
              const userData = JSON.parse(userJson);
              const userInfo: Auth.User = {
                id: userData.id,
                openId: userData.openId,
                name: userData.name,
                email: userData.email,
                loginMethod: userData.loginMethod,
                lastSignedIn: new Date(userData.lastSignedIn || Date.now()),
              };
              await Auth.setUserInfo(userInfo);
              console.log("[OAuth] User info stored:", userInfo);
            } catch (err) {
              console.error("[OAuth] Failed to parse user data:", err);
            }
          }

          setStatus("success");
          console.log("[OAuth] Web authentication successful, redirecting to home...");
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 1000);
          return;
        }

        // Get URL from params or Linking
        let url: string | null = null;

        // Try to get from local search params first (works with expo-router)
        if (params.code || params.state || params.error) {
          console.log("[OAuth] Found params in route params");
          // Extract from params
          const urlParams = new URLSearchParams();
          if (params.code) urlParams.set("code", params.code);
          if (params.state) urlParams.set("state", params.state);
          if (params.error) urlParams.set("error", params.error);
          url = `?${urlParams.toString()}`;
          console.log("[OAuth] Constructed URL from params:", url);
        } else {
          console.log("[OAuth] No params found, checking Linking.getInitialURL()...");
          // Fallback: try to get from Linking
          const initialUrl = await Linking.getInitialURL();
          console.log("[OAuth] Linking.getInitialURL():", initialUrl);
          if (initialUrl) {
            url = initialUrl;
          }
        }

        // Capture an error for the shared outcome resolver after URL extraction.
        const error = params.error || readOAuthErrorParam(url);

        // Check for code and state
        let code: string | null = null;
        let state: string | null = null;
        let sessionToken: string | null = null;

        // Try to get from params first
        if (params.code && params.state) {
          console.log("[OAuth] Using code and state from route params");
          code = params.code;
          state = params.state;
        } else if (url) {
          console.log("[OAuth] Parsing code and state from URL:", url);
          // Parse from URL
          try {
            const urlObj = new URL(url);
            code = urlObj.searchParams.get("code");
            state = urlObj.searchParams.get("state");
            sessionToken = urlObj.searchParams.get("sessionToken");
            console.log("[OAuth] Extracted from URL:", {
              code: code?.substring(0, 20) + "...",
              state: state?.substring(0, 20) + "...",
              sessionToken: sessionToken ? "present" : "missing",
            });
          } catch (e) {
            console.log("[OAuth] Failed to parse as full URL, trying regex:", e);
            // Try parsing as relative URL with query params
            const fallbackParams = parseOAuthFallbackParams(url);
            code = fallbackParams.code ?? null;
            state = fallbackParams.state ?? null;
            sessionToken = fallbackParams.sessionToken ?? null;
            console.log("[OAuth] Extracted from regex:", {
              code: code?.substring(0, 20) + "...",
              state: state?.substring(0, 20) + "...",
              sessionToken: sessionToken ? "present" : "missing",
            });
          }
        }

        console.log("[OAuth] Final extracted values:", {
          hasCode: !!code,
          hasState: !!state,
          hasSessionToken: !!sessionToken,
        });

        const outcome = resolveOAuthCallbackOutcome({ error, sessionToken, code, state });

        if (outcome.kind === "error") {
          console.error("[OAuth] Error parameter found:", outcome.message);
          setStatus("error");
          setErrorMessage(outcome.message);
          return;
        }

        // If we have sessionToken directly from URL, use it
        if (outcome.kind === "session-token") {
          console.log("[OAuth] Session token found in URL, storing...");
          await Auth.setSessionToken(outcome.sessionToken);
          console.log("[OAuth] Session token stored successfully");
          // User info is already in the OAuth callback response
          // No need to fetch from API
          setStatus("success");
          console.log("[OAuth] Redirecting to home...");
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 1000);
          return;
        }

        // Otherwise, exchange code for session token
        if (outcome.kind === "missing-parameters") {
          console.error("[OAuth] Missing code or state parameter", {
            hasCode: !!code,
            hasState: !!state,
          });
          setStatus("error");
          setErrorMessage(outcome.message);
          return;
        }

        // Exchange code for session token
        console.log("[OAuth] Exchanging code for session token...", {
          code: outcome.code.substring(0, 20) + "...",
          state: outcome.state.substring(0, 20) + "...",
        });
        const result = await Api.exchangeOAuthCode(outcome.code, outcome.state);
        console.log("[OAuth] Exchange result:", {
          hasSessionToken: !!result.sessionToken,
          hasUser: !!result.user,
        });

        if (result.sessionToken) {
          console.log("[OAuth] Session token received, storing...");
          // Store session token
          await Auth.setSessionToken(result.sessionToken);
          console.log("[OAuth] Session token stored successfully");

          // Store user info if available
          if (result.user) {
            console.log("[OAuth] User data received:", result.user);
            const userInfo: Auth.User = {
              id: result.user.id,
              openId: result.user.openId,
              name: result.user.name,
              email: result.user.email,
              loginMethod: result.user.loginMethod,
              lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
            };
            await Auth.setUserInfo(userInfo);
            console.log("[OAuth] User info stored:", userInfo);
          } else {
            console.log("[OAuth] No user data in result");
          }

          setStatus("success");
          console.log("[OAuth] Authentication successful, redirecting to home...");

          // Redirect to home after a short delay
          setTimeout(() => {
            console.log("[OAuth] Executing redirect...");
            router.replace("/(tabs)");
          }, 1000);
        } else {
          console.error("[OAuth] No session token in result:", result);
          setStatus("error");
          setErrorMessage("No session token received");
        }
      } catch (error) {
        console.error("[OAuth] Callback error:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to complete authentication",
        );
      }
    };

    handleCallback();
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
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
