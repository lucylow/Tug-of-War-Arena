import { describe, expect, it } from "vitest";

import {
  normalizeMessage,
  normalizeToolChoice,
  type Message,
  type Tool,
} from "../server/_core/llm";

const singleTool: Tool = {
  type: "function",
  function: { name: "record_match" },
};

const userMessage = (content: Message["content"]): Message => ({
  role: "user",
  content,
});

describe("LLM normalization contracts", () => {
  it("collapses string and text-part messages to plain text", () => {
    expect(normalizeMessage(userMessage("hello"))).toMatchObject({ role: "user", content: "hello" });
    expect(
      normalizeMessage(userMessage({ type: "text", text: "hello" })),
    ).toMatchObject({ role: "user", content: "hello" });
  });

  it("preserves multimodal content as an ordered array", () => {
    expect(
      normalizeMessage(
        userMessage([
          { type: "text", text: "inspect this" },
          { type: "image_url", image_url: { url: "https://example.com/image.png" } },
        ]),
      ),
    ).toMatchObject({
      role: "user",
      content: [
        { type: "text", text: "inspect this" },
        { type: "image_url", image_url: { url: "https://example.com/image.png" } },
      ],
    });
  });

  it("resolves required tool choice only when exactly one tool is configured", () => {
    expect(normalizeToolChoice("required", [singleTool])).toEqual({
      type: "function",
      function: { name: "record_match" },
    });
    expect(() => normalizeToolChoice("required", undefined)).toThrow(
      "tool_choice 'required' was provided but no tools were configured",
    );
    expect(() => normalizeToolChoice("required", [singleTool, singleTool])).toThrow(
      "tool_choice 'required' needs a single tool or specify the tool name explicitly",
    );
  });
});
