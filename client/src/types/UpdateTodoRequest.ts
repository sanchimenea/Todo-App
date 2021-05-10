export interface UpdateTodoRequest {
  name: string
  dueDate?: string
  done: boolean
  important: boolean
}