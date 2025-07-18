import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert } from "@/supabase/types"

export const getAssistantFilesByAssistantId = async (assistantId: string) => {
  const { data: assistantFiles, error } = await supabase
    .from("assistants")
    .select(
      `
        id, 
        name, 
        files (*)
      `
    )
    .eq("id", assistantId)
    .limit(1)
    .maybeSingle()

  if (!assistantFiles) {
    throw new Error(error?.message || "Assistant file not found.")
  }

  return assistantFiles
}

export const createAssistantFile = async (
  assistantFile: TablesInsert<"assistant_files">
) => {
  const { data: createdAssistantFile, error } = await supabase
    .from("assistant_files")
    .insert(assistantFile)
    .select("*")

  if (!createdAssistantFile) {
    throw new Error(error?.message || "Error creating assistant file.")
  }

  return createdAssistantFile
}

export const createAssistantFiles = async (
  assistantFiles: TablesInsert<"assistant_files">[]
) => {
  const { data: createdAssistantFiles, error } = await supabase
    .from("assistant_files")
    .insert(assistantFiles)
    .select("*")

  if (!createdAssistantFiles) {
    throw new Error(error?.message || "Error creating assistant files.")
  }

  return createdAssistantFiles
}

export const deleteAssistantFile = async (
  assistantId: string,
  fileId: string
) => {
  const { error } = await supabase
    .from("assistant_files")
    .delete()
    .eq("assistant_id", assistantId)
    .eq("file_id", fileId)

  if (error) throw new Error(error.message)

  return true
}
