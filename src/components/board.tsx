import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { createPortal } from "react-dom"

import { Column, Id, Task } from "../types"
import { ColumnContainer } from "./column"
import { TaskCard } from "./TaskCard"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog"
import { useLocalStorage } from "../hooks/use-local-storage"

export function KanbanBoard() {
  const [columns, setColumns] = useLocalStorage<Column[]>("columns", [])
  const [tasks, setTasks] = useLocalStorage<Task[]>("tasks", [])
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [showNewColumnDialog, setShowNewColumnDialog] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  )

  const createNewColumn = () => {
    const columnToAdd: Column = {
      id: generateId(),
      title: newColumnTitle,
    }

    setColumns([...columns, columnToAdd])
    setNewColumnTitle("")
    setShowNewColumnDialog(false)
  }

  const createTask = (columnId: Id) => {
    const newTask: Task = {
      id: generateId(),
      columnId,
      title: `New Task`,
      date: new Date().toISOString(),
    }

    setTasks([...tasks, newTask])
  }

  const deleteTask = (id: Id) => {
    const newTasks = tasks.filter((task) => task.id !== id)
    setTasks(newTasks)
  }

  const editTask = (id: Id, title: string, date: string) => {
    const newTasks = tasks.map((task) =>
      task.id === id ? { ...task, title, date } : task
    )
    setTasks(newTasks)
  }

  const deleteColumn = (id: Id) => {
    const filteredColumns = columns.filter((col) => col.id !== id)
    setColumns(filteredColumns)
    const newTasks = tasks.filter((t) => t.columnId !== id)
    setTasks(newTasks)
  }

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column)
      return
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task)
      return
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null)
    setActiveTask(null)

    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveColumn = active.data.current?.type === "Column"
    if (!isActiveColumn) return

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId)
      const overColumnIndex = columns.findIndex((col) => col.id === overId)
      return arrayMove(columns, activeColumnIndex, overColumnIndex)
    })
  }

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === "Task"
    const isOverTask = over.data.current?.type === "Task"

    if (!isActiveTask) return

    if (isActiveTask && isOverTask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        const overIndex = tasks.findIndex((t) => t.id === overId)
        
        if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
          tasks[activeIndex].columnId = tasks[overIndex].columnId
          return arrayMove(tasks, activeIndex, overIndex - 1)
        }

        return arrayMove(tasks, activeIndex, overIndex)
      })
    }

    const isOverColumn = over.data.current?.type === "Column"

    if (isActiveTask && isOverColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        tasks[activeIndex].columnId = overId
        return arrayMove(tasks, activeIndex, activeIndex)
      })
    }
  }

  return (
    <div className="min-h-screen w-full p-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="4" fill="#8B5CF6"/>
            <path d="M7 12H17M7 8H17M7 16H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="text-3xl font-bold">TaskPlanz </h1>
        </div>
        <Button onClick={() => setShowNewColumnDialog(true)}>
          Add Column
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="flex gap-4">
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((col) => (
              <ColumnContainer
                key={col.id}
                column={col}
                tasks={tasks.filter((task) => task.columnId === col.id)}
                onAddTask={createTask}
                onDeleteTask={deleteTask}
                onEditTask={editTask}
                onDeleteColumn={deleteColumn}
              />
            ))}
          </SortableContext>
        </div>

        {typeof document !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeColumn && (
                <ColumnContainer
                  column={activeColumn}
                  tasks={tasks.filter(
                    (task) => task.columnId === activeColumn.id
                  )}
                  onAddTask={createTask}
                  onDeleteTask={deleteTask}
                  onEditTask={editTask}
                  onDeleteColumn={deleteColumn}
                />
              )}
              {activeTask && (
                <TaskCard
                  task={activeTask}
                  onDelete={deleteTask}
                  onEdit={editTask}
                />
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-sm text-muted-foreground bg-background/80 backdrop-blur-sm border-t">
      © 2024 by Abdullah Chandio 💻
      </footer>
      <Dialog open={showNewColumnDialog} onOpenChange={setShowNewColumnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Column</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter column title"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewColumnDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={createNewColumn} disabled={!newColumnTitle}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function generateId() {
  return Math.floor(Math.random() * 10001)
}

