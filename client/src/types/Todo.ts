export interface Todo {
  todoId: string
  createdAt: string
  name: string
  dueDate?: string
  done: boolean
  important: boolean
  attachments?: { [key: string]: { [key: string]: string } }
}
