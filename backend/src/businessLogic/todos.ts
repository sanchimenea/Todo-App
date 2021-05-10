import * as uuid from 'uuid'
import dateFormat from 'dateformat'
import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoUpdateParams } from '../models/TodoUpdateParam'
import { paramsDeleteDueDate, paramsDoneOrImportant, paramsUpdateDueDate } from './updateQueries'


const todosAccess = new TodoAccess()

export async function getTodosByUser(userId: string): Promise<TodoItem[]> {
    return await todosAccess.getTodosByUser(userId)
}

export async function createTodo(userId: string, newTodo: CreateTodoRequest) {
    const todoId = uuid.v4()
    const createdAt = dateFormat(new Date(), 'yyyy-mm-dd') as string

    const newItem = await todosAccess.createTodo({
        userId,
        todoId,
        createdAt,
        done: false,
        important: false,
        ...newTodo
    })

    delete newItem.userId

    return newItem
}

export async function todoExists(todoId: string, userId: string) {
    return await todosAccess.todoExists(todoId, userId)
}

export async function deleteTodo(todoId: string, userId: string) {
    return await todosAccess.deleteTodo(todoId, userId)

}

export async function updateTodo(updatedTodo: UpdateTodoRequest, todoId: string, userId: string) {
    let params: TodoUpdateParams;

    if (updatedTodo.dueDate && updatedTodo.dueDate != "delete") {
        params = paramsUpdateDueDate(updatedTodo, userId, todoId);
    }
    else if (updatedTodo.dueDate && updatedTodo.dueDate == "delete") {
        params = paramsDeleteDueDate(userId, todoId)
    }
    else {
        params = paramsDoneOrImportant(updatedTodo, userId, todoId)
    }

    return await todosAccess.updateTodo(params)
}

export async function addUrlTodo(todoId: string, userId: string, attachmentUrl: string) {
    const params: TodoUpdateParams = {
        Key: {
            "userId": userId,
            "todoId": todoId
        },
        UpdateExpression: "set attachmentUrl = :attachmentUrl",
        ExpressionAttributeValues: {
            ":attachmentUrl": attachmentUrl
        }
    };

    return await todosAccess.updateTodo(params)
}