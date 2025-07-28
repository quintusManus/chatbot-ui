import { ChatbotUIContext } from "@/context/context"
import {
  PROFILE_CONTEXT_MAX,
  PROFILE_DISPLAY_NAME_MAX,
  PROFILE_USERNAME_MAX,
  PROFILE_USERNAME_MIN
} from "@/db/limits"
import { updateProfile } from "@/db/profile"
import { uploadProfileImage } from "@/db/storage/profile-images"
import { exportLocalStorageAsJSON } from "@/lib/export-old-data"
import { fetchOpenRouterModels } from "@/lib/models/fetch-models"
import { LLM_LIST_MAP } from "@/lib/models/llm/llm-list"
import { supabase } from "@/lib/supabase/browser-client"
import { cn } from "@/lib/utils"
import { OpenRouterLLM } from "@/types"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconFileDownload,
  IconLoader2,
  IconLogout,
  IconUser
} from "@tabler/icons-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { FC, useCallback, useContext, useRef, useState } from "react"
import { toast } from "sonner"
import { SIDEBAR_ICON_SIZE } from "../sidebar/sidebar-switcher"
import { Button } from "../ui/button"
import ImagePicker from "../ui/image-picker"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { LimitDisplay } from "../ui/limit-display"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "../ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { WithTooltip } from "../ui/with-tooltip"
import { ThemeSwitcher } from "./theme-switcher"

// The profile context already provides typed profile data.

interface ProfileSettingsProps {}

export const ProfileSettings: FC<ProfileSettingsProps> = ({}) => {
  const {
    profile,
    setProfile,
    envKeyMap,
    setAvailableHostedModels,
    setAvailableOpenRouterModels,
    availableOpenRouterModels
  } = useContext(ChatbotUIContext)

  // Hooks must be called unconditionally
  const router = useRouter()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "")
  const [username, setUsername] = useState(profile?.username ?? "")
  const [usernameAvailable, setUsernameAvailable] = useState(true)
  const [loadingUsername, setLoadingUsername] = useState(false)
  const [profileImageSrc, setProfileImageSrc] = useState(
    profile?.image_url ?? ""
  )
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileInstructions, setProfileInstructions] = useState(
    profile?.profile_context ?? ""
  )
  const [useAzureOpenai, setUseAzureOpenai] = useState(
    profile?.use_azure_openai ?? false
  )
  const [openaiAPIKey, setOpenaiAPIKey] = useState(
    profile?.openai_api_key ?? ""
  )
  const [openaiOrgID, setOpenaiOrgID] = useState(
    profile?.openai_organization_id ?? ""
  )
  const [azureOpenaiAPIKey, setAzureOpenaiAPIKey] = useState(
    profile?.azure_openai_api_key ?? ""
  )
  const [azureOpenaiEndpoint, setAzureOpenaiEndpoint] = useState(
    profile?.azure_openai_endpoint ?? ""
  )
  const [azureOpenai35TurboID, setAzureOpenai35TurboID] = useState(
    profile?.azure_openai_35_turbo_id ?? ""
  )
  const [azureOpenai45TurboID, setAzureOpenai45TurboID] = useState(
    profile?.azure_openai_45_turbo_id ?? ""
  )
  const [azureOpenai45VisionID, setAzureOpenai45VisionID] = useState(
    profile?.azure_openai_45_vision_id ?? ""
  )
  const [azureEmbeddingsID, setAzureEmbeddingsID] = useState(
    profile?.azure_openai_embeddings_id ?? ""
  )
  const [anthropicAPIKey, setAnthropicAPIKey] = useState(
    profile?.anthropic_api_key ?? ""
  )
  const [googleGeminiAPIKey, setGoogleGeminiAPIKey] = useState(
    profile?.google_gemini_api_key ?? ""
  )
  const [mistralAPIKey, setMistralAPIKey] = useState(
    profile?.mistral_api_key ?? ""
  )
  const [groqAPIKey, setGroqAPIKey] = useState(profile?.groq_api_key ?? "")
  const [perplexityAPIKey, setPerplexityAPIKey] = useState(
    profile?.perplexity_api_key ?? ""
  )
  const [openrouterAPIKey, setOpenrouterAPIKey] = useState(
    profile?.openrouter_api_key ?? ""
  )

  // Hook: prepare export data callback
  const handleExportData = useCallback(async () => {
    if (!profile) {
      toast.error("Failed to export data.")
      return
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, username, email, created_at, updated_at")
      .eq("id", profile.id)
      .single()

    if (error) {
      toast.error("Failed to export data.")
      return
    }

    exportLocalStorageAsJSON()
  }, [profile])

  // If no profile, do not render settings
  if (!profile) {
    return null
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
    return
  }

  const handleSave = async () => {
    if (!profile) return
    let profileImageUrl = profile.image_url
    let profileImagePath = ""

    if (profileImageFile) {
      const { path, url } = await uploadProfileImage(profile, profileImageFile)
      profileImageUrl = url ?? profileImageUrl
      profileImagePath = path
    }

    const updatedProfile = await updateProfile(profile.id, {
      groq_api_key: groqAPIKey,
      perplexity_api_key: perplexityAPIKey,
      use_azure_openai: useAzureOpenai,
      azure_openai_api_key: azureOpenaiAPIKey,
      azure_openai_endpoint: azureOpenaiEndpoint,
      azure_openai_35_turbo_id: azureOpenai35TurboID,
      azure_openai_45_turbo_id: azureOpenai45TurboID,
      azure_openai_45_vision_id: azureOpenai45VisionID,
      azure_openai_embeddings_id: azureEmbeddingsID,
      openrouter_api_key: openrouterAPIKey
    })
    if (!updatedProfile) {
      toast.error("Failed to update profile.")
      return
    }

    setProfile(updatedProfile)

    toast.success("Profile updated.")
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)

    if (value.length < PROFILE_USERNAME_MIN) {
      setUsernameAvailable(false)
    } else if (value.length > PROFILE_USERNAME_MAX) {
      setUsernameAvailable(false)
    } else {
      setLoadingUsername(true)
      setUsernameAvailable(true)

      setTimeout(() => {
        setLoadingUsername(false)
      }, 1000)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-muted-foreground text-sm">
          Update your profile information and preferences.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={PROFILE_DISPLAY_NAME_MAX}
            />
            <LimitDisplay
              used={displayName.length}
              limit={PROFILE_DISPLAY_NAME_MAX}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center gap-2">
              <Input
                id="username"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Enter your username"
                maxLength={PROFILE_USERNAME_MAX}
              />
              {username.length > 0 && (
                <WithTooltip
                  display={
                    usernameAvailable ? (
                      <span>Username is available!</span>
                    ) : (
                      <span>Username is not available.</span>
                    )
                  }
                  trigger={
                    usernameAvailable ? (
                      <IconCircleCheckFilled className="text-green-500" />
                    ) : (
                      <IconCircleXFilled className="text-red-500" />
                    )
                  }
                  side="top"
                />
              )}
            </div>
            <LimitDisplay used={username.length} limit={PROFILE_USERNAME_MAX} />
            {loadingUsername && (
              <div className="flex items-center gap-2">
                <IconLoader2 className="size-5 animate-spin" />
                <span className="text-muted-foreground text-sm">
                  Checking username availability...
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-image">Profile Image</Label>
            <ImagePicker
              image={profileImageFile}
              src={profileImageSrc}
              onSrcChange={url => setProfileImageSrc(url)}
              onImageChange={file => setProfileImageFile(file)}
              width={SIDEBAR_ICON_SIZE}
              height={SIDEBAR_ICON_SIZE}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-instructions">Profile Instructions</Label>
            <TextareaAutosize
              value={profileInstructions}
              onValueChange={val => setProfileInstructions(val)}
              placeholder="Enter profile instructions"
              minRows={3}
              maxLength={PROFILE_CONTEXT_MAX}
              className="resize-none"
            />
            <LimitDisplay
              used={profileInstructions.length}
              limit={PROFILE_CONTEXT_MAX}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            <Input
              id="openai-api-key"
              value={openaiAPIKey}
              onChange={e => setOpenaiAPIKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              type="password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="openai-org-id">OpenAI Organization ID</Label>
            <Input
              id="openai-org-id"
              value={openaiOrgID}
              onChange={e => setOpenaiOrgID(e.target.value)}
              placeholder="Enter your OpenAI Organization ID"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="azure-openai-api-key">Azure OpenAI API Key</Label>
            <Input
              id="azure-openai-api-key"
              value={azureOpenaiAPIKey}
              onChange={e => setAzureOpenaiAPIKey(e.target.value)}
              placeholder="Enter your Azure OpenAI API key"
              type="password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="azure-openai-endpoint">Azure OpenAI Endpoint</Label>
            <Input
              id="azure-openai-endpoint"
              value={azureOpenaiEndpoint}
              onChange={e => setAzureOpenaiEndpoint(e.target.value)}
              placeholder="Enter your Azure OpenAI endpoint"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="azure-openai-35-turbo-id">
              Azure OpenAI 3.5 Turbo Model ID
            </Label>
            <Input
              id="azure-openai-35-turbo-id"
              value={azureOpenai35TurboID}
              onChange={e => setAzureOpenai35TurboID(e.target.value)}
              placeholder="Enter Azure OpenAI 3.5 Turbo Model ID"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="azure-openai-45-turbo-id">
              Azure OpenAI 4.5 Turbo Model ID
            </Label>
            <Input
              id="azure-openai-45-turbo-id"
              value={azureOpenai45TurboID}
              onChange={e => setAzureOpenai45TurboID(e.target.value)}
              placeholder="Enter Azure OpenAI 4.5 Turbo Model ID"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="azure-openai-45-vision-id">
              Azure OpenAI 4.5 Vision Model ID
            </Label>
            <Input
              id="azure-openai-45-vision-id"
              value={azureOpenai45VisionID}
              onChange={e => setAzureOpenai45VisionID(e.target.value)}
              placeholder="Enter Azure OpenAI 4.5 Vision Model ID"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="azure-embeddings-id">
              Azure OpenAI Embeddings Model ID
            </Label>
            <Input
              id="azure-embeddings-id"
              value={azureEmbeddingsID}
              onChange={e => setAzureEmbeddingsID(e.target.value)}
              placeholder="Enter Azure OpenAI Embeddings Model ID"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="anthropic-api-key">Anthropic API Key</Label>
            <Input
              id="anthropic-api-key"
              value={anthropicAPIKey}
              onChange={e => setAnthropicAPIKey(e.target.value)}
              placeholder="Enter your Anthropic API key"
              type="password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="google-gemini-api-key">Google Gemini API Key</Label>
            <Input
              id="google-gemini-api-key"
              value={googleGeminiAPIKey}
              onChange={e => setGoogleGeminiAPIKey(e.target.value)}
              placeholder="Enter your Google Gemini API key"
              type="password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mistral-api-key">Mistral API Key</Label>
            <Input
              id="mistral-api-key"
              value={mistralAPIKey}
              onChange={e => setMistralAPIKey(e.target.value)}
              placeholder="Enter your Mistral API key"
              type="password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="openrouter-api-key">OpenRouter API Key</Label>
            <Input
              id="openrouter-api-key"
              value={openrouterAPIKey}
              onChange={e => setOpenrouterAPIKey(e.target.value)}
              placeholder="Enter your OpenRouter API key"
              type="password"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full"
          ref={buttonRef}
        >
          Sign Out
        </Button>
        <Button
          variant="secondary"
          onClick={handleExportData}
          className="w-full"
        >
          Export Data
        </Button>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full">
            Advanced Settings
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Advanced Settings</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="env-key-map">Environment Key Map</Label>
              <TextareaAutosize
                value={JSON.stringify(envKeyMap, null, 2)}
                onValueChange={val => setAvailableHostedModels(JSON.parse(val))}
                placeholder="Enter your environment key map"
                minRows={3}
                className="resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="open-router-models">OpenRouter Models</Label>
              <TextareaAutosize
                value={JSON.stringify(availableOpenRouterModels, null, 2)}
                onValueChange={val =>
                  setAvailableOpenRouterModels(JSON.parse(val))
                }
                placeholder="Enter your OpenRouter models"
                minRows={3}
                className="resize-none"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
