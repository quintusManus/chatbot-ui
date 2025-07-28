import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ServerRuntime } from "next"
import OpenAI from "openai"

export const runtime: ServerRuntime = "edge"

export async function GET() {
  try {
    const profile = await getServerProfile()
    const openaiApiKey = profile?.openai_api_key || ""
    const openaiOrgId = profile?.openai_organization_id
    if (openaiApiKey) {
      checkApiKey(openaiApiKey, "OpenAI")
    }
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      organization: openaiOrgId
    })

    const myAssistants = await openai.beta.assistants.list({
      limit: 100
    })

    return new Response(JSON.stringify({ assistants: myAssistants.data }), {
      status: 200
    })
  } catch (error: any) {
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
