import { useState } from "react"
import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"

import { Column, Id, Task } from "../types"
import { TaskCard } from "./TaskCard"
import { Button } from "./components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card"

interface Props {
  column: Column
  tasks: Task[]
  onAddTask: (columnId: Id) => void
  onDeleteTask: (id: Id) => void
  onEditTask: (id: Id, title: string, date: string) => void
  onDeleteColumn: (id: Id) => void
}

export function ColumnContainer({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onDeleteColumn,
}: Props) {
  const [editMode, setEditMode] = useState(false)
  const [title, setTitle] = useState(column.title)

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-muted/50 border-2 border-primary/20 w-[350px] h-[500px] rounded-lg"
      />
    )
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="w-[350px]">
        <CardHeader className="p-4 flex flex-row items-center space-y-0">
          {editMode ? (
            <input
              className="flex-1 px-2 py-1 text-lg font-semibold border rounded focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              onBlur={() => setEditMode(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditMode(false)
              }}
            />
          ) : (
            <CardTitle
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing"
            >
              {column.title}
            </CardTitle>
          )}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onDeleteColumn(column.id)}>
            Delete
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-2">
          <SortableContext items={tasks.map((task) => task.id)}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
              />
            ))}
          </SortableContext>
        </CardContent>
        <CardFooter className="p-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onAddTask(column.id)}
          >
            Add Task
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

