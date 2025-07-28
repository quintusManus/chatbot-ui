import fs from "fs"
import path from "path"
import { checkApiKey } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "nodejs"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }
  let messages = (json as { chatSettings: ChatSettings; messages: any[] })
    .messages

  let profile = null
  let openaiApiKey = null
  let openaiOrgId = undefined
  try {
    // Try to get user profile, but allow anonymous fallback
    try {
      const mod = await import("@/lib/server/server-chat-helpers")
      profile = await mod.getServerProfile()
      openaiApiKey =
        profile && profile.openai_api_key ? profile.openai_api_key : null
      openaiOrgId = profile ? profile.openai_organization_id : undefined
    } catch (e) {
      // Anonymous: fallback to env
      openaiApiKey = process.env.OPENAI_API_KEY || null
      openaiOrgId = process.env.OPENAI_ORGANIZATION_ID
    }

    if (!openaiApiKey) {
      checkApiKey(openaiApiKey, "OpenAI")
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey || undefined,
      organization: openaiOrgId
    })

    // Load and inject Peak Performance Gym FAQ as the system prompt
    const faqPath = path.join(process.cwd(), "public", "faqs.md")
    let faqText = ""
    if (fs.existsSync(faqPath)) {
      faqText = fs.readFileSync(faqPath, "utf8")
    } else {
      console.error("FAQ file not found at", faqPath)
    }
    const faqSystemMessage = {
      role: "system",
      content: `You are Peak Performance Gym’s AI assistant. Answer only from the FAQs below:\n\n${faqText}`
    }
    // Prepend FAQ system message
    messages = [faqSystemMessage, ...messages]

    const response = await openai.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      max_tokens:
        chatSettings.model === "gpt-4-vision-preview" ||
        chatSettings.model === "gpt-4o"
          ? 4096
          : null, // TODO: Fix
      stream: true
    })

    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenAI API Key not found. Please set it in your profile settings or as an environment variable."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "OpenAI API Key is incorrect. Please fix it in your profile settings or environment."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
