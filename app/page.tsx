"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Plus, Hash, Star, Archive, Trash2, Menu, X, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  isStarred: boolean
  isArchived: boolean
}

export default function BearNotesApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("bear-notes")
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }))
      setNotes(parsedNotes)
    } else {
      // Create a welcome note
      const welcomeNote: Note = {
        id: "welcome",
        title: "Welcome to Bear Notes",
        content: `# Welcome to Bear Notes! 🐻

This is your personal note hosting platform inspired by Bear.

## Features
- **Markdown support** for beautiful formatting
- **Tag organization** using #hashtags
- **Quick search** to find anything instantly
- **Star important notes** ⭐
- **Archive old notes** 📦

## Getting Started
1. Create a new note with the + button
2. Use #tags to organize your thoughts
3. Star important notes for quick access
4. Use the search to find anything instantly

## Markdown Examples
You can use **bold**, *italic*, and \`code\` formatting.

### Lists
- Item one
- Item two
- Item three

### Tags
Add tags anywhere in your notes: #personal #work #ideas

Happy note-taking! 📝

#welcome #getting-started`,
        tags: ["welcome", "getting-started"],
        createdAt: new Date(),
        updatedAt: new Date(),
        isStarred: true,
        isArchived: false,
      }
      setNotes([welcomeNote])
      setSelectedNote(welcomeNote)
    }
  }, [])

  // Save notes to localStorage
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("bear-notes", JSON.stringify(notes))
    }
  }, [notes])

  // Extract tags from content
  const extractTags = (content: string): string[] => {
    const tagRegex = /#[\w-]+/g
    const matches = content.match(tagRegex)
    return matches ? matches.map((tag) => tag.slice(1).toLowerCase()) : []
  }

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags))).sort()

  // Create new note
  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isStarred: false,
      isArchived: false,
    }
    setNotes([newNote, ...notes])
    setSelectedNote(newNote)
    setIsEditing(true)
    setEditContent("")
  }

  // Update note
  const updateNote = (noteId: string, updates: Partial<Note>) => {
    setNotes(notes.map((note) => (note.id === noteId ? { ...note, ...updates, updatedAt: new Date() } : note)))
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, ...updates, updatedAt: new Date() })
    }
  }

  // Save note content
  const saveNote = () => {
    if (!selectedNote) return

    const tags = extractTags(editContent)
    const title = editContent.split("\n")[0].replace(/^#\s*/, "") || "Untitled Note"

    updateNote(selectedNote.id, {
      title,
      content: editContent,
      tags,
    })
    setIsEditing(false)
  }

  // Delete note
  const deleteNote = (noteId: string) => {
    setNotes(notes.filter((note) => note.id !== noteId))
    if (selectedNote?.id === noteId) {
      setSelectedNote(null)
    }
  }

  // Toggle star
  const toggleStar = (noteId: string) => {
    updateNote(noteId, { isStarred: !notes.find((n) => n.id === noteId)?.isStarred })
  }

  // Toggle archive
  const toggleArchive = (noteId: string) => {
    updateNote(noteId, { isArchived: !notes.find((n) => n.id === noteId)?.isArchived })
  }

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    if (selectedTag === "starred" && !note.isStarred) return false
    if (selectedTag === "archived" && !note.isArchived) return false
    if (selectedTag === "untagged" && note.tags.length > 0) return false
    if (
      selectedTag !== "all" &&
      selectedTag !== "starred" &&
      selectedTag !== "archived" &&
      selectedTag !== "untagged"
    ) {
      if (!note.tags.includes(selectedTag)) return false
    }

    if (searchTerm) {
      return (
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    return !note.isArchived || selectedTag === "archived"
  })

  // Start editing
  const startEditing = () => {
    if (selectedNote) {
      setEditContent(selectedNote.content)
      setIsEditing(true)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false)
    setEditContent("")
  }

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  // Render markdown-like content
  const renderContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      // Headers
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-2xl font-bold mb-4 mt-6 first:mt-0">
            {line.slice(2)}
          </h1>
        )
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-xl font-semibold mb-3 mt-5 first:mt-0">
            {line.slice(3)}
          </h2>
        )
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-lg font-medium mb-2 mt-4 first:mt-0">
            {line.slice(4)}
          </h3>
        )
      }

      // Lists
      if (line.startsWith("- ")) {
        return (
          <li key={index} className="ml-4 mb-1">
            {line.slice(2)}
          </li>
        )
      }

      // Empty lines
      if (line.trim() === "") {
        return <br key={index} />
      }

      // Regular paragraphs with inline formatting
      let formattedLine = line
      // Bold
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Code
      formattedLine = formattedLine.replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>',
      )
      // Tags
      formattedLine = formattedLine.replace(/#([\w-]+)/g, '<span class="text-blue-600 font-medium">#$1</span>')

      return <p key={index} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
    })
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 border-r border-gray-200 flex flex-col overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Bear Notes</h1>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="md:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200"
            />
          </div>

          <Button onClick={createNote} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        {/* Tags */}
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-1">
            <button
              onClick={() => setSelectedTag("all")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTag === "all" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
            >
              <Hash className="inline h-4 w-4 mr-2" />
              All Notes ({notes.filter((n) => !n.isArchived).length})
            </button>

            <button
              onClick={() => setSelectedTag("starred")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTag === "starred" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
            >
              <Star className="inline h-4 w-4 mr-2" />
              Starred ({notes.filter((n) => n.isStarred && !n.isArchived).length})
            </button>

            <button
              onClick={() => setSelectedTag("untagged")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTag === "untagged" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
            >
              <Hash className="inline h-4 w-4 mr-2" />
              Untagged ({notes.filter((n) => n.tags.length === 0 && !n.isArchived).length})
            </button>

            <button
              onClick={() => setSelectedTag("archived")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTag === "archived" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
              }`}
            >
              <Archive className="inline h-4 w-4 mr-2" />
              Archived ({notes.filter((n) => n.isArchived).length})
            </button>
          </div>

          {allTags.length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="space-y-1">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedTag === tag ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <Hash className="inline h-4 w-4 mr-2" />
                    {tag} ({notes.filter((n) => n.tags.includes(tag) && !n.isArchived).length})
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notes List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No notes found</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note)
                    setIsEditing(false)
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                    selectedNote?.id === note.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-sm text-gray-800 line-clamp-1">{note.title}</h3>
                    <div className="flex items-center gap-1 ml-2">
                      {note.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                      {note.isArchived && <Archive className="h-3 w-3 text-gray-400" />}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {note.content.replace(/[#*`]/g, "").substring(0, 100)}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                          #{tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(note.updatedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {selectedNote && (
              <>
                <h2 className="font-semibold text-gray-800">{selectedNote.title}</h2>
                <span className="text-sm text-gray-500">{formatDate(selectedNote.updatedAt)}</span>
              </>
            )}
          </div>

          {selectedNote && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStar(selectedNote.id)}
                className={selectedNote.isStarred ? "text-yellow-500" : ""}
              >
                <Star className={`h-4 w-4 ${selectedNote.isStarred ? "fill-current" : ""}`} />
              </Button>

              <Button variant="ghost" size="sm" onClick={() => toggleArchive(selectedNote.id)}>
                <Archive className="h-4 w-4" />
              </Button>

              {isEditing ? (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveNote}>
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={startEditing}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteNote(selectedNote.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Editor/Viewer */}
        <div className="flex-1 overflow-hidden">
          {selectedNote ? (
            isEditing ? (
              <div className="h-full p-6">
                <Textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Start writing... Use # for headers, **bold**, *italic*, `code`, and #tags"
                  className="w-full h-full resize-none border-none focus:ring-0 text-base leading-relaxed font-mono"
                />
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6 max-w-4xl">
                  <div className="prose prose-gray max-w-none">{renderContent(selectedNote.content)}</div>
                </div>
              </ScrollArea>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Hash className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">Select a note to view</p>
                <p className="text-sm">Choose a note from the sidebar or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
