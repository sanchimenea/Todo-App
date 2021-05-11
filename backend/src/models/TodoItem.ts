export interface TodoItem {
  userId: string
  todoId: string
  createdAt: string
  name: string
  dueDate?: string
  done: boolean
  important: boolean
  attachments?: { [key: string]: string }
}
