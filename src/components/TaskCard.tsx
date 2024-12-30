import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"

import { Task } from "../types"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader } from "./components/ui/card"
import { formatDateTime } from "../utils/date"

interface Props {
  task: Task
  onDelete: (id: Task["id"]) => void
  onEdit: (id: Task["id"], title: string, date: string) => void
}

export function TaskCard({ task, onDelete, onEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSubmit = () => {
    onEdit(task.id, title, new Date().toISOString())
    setIsEditing(false)
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-muted/50 border-2 border-primary/20 rounded-lg h-[80px] w-full"
      />
    )
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="cursor-grab active:cursor-grabbing">
        <CardHeader className="p-3">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-1 text-sm border rounded"
              autoFocus
            />
          ) : (
            <div className="text-sm font-medium">{task.title}</div>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-0 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {formatDateTime(new Date(task.date))}
          </span>
          {isEditing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(task.id)}>
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

