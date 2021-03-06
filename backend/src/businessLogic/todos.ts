import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoUpdateParams } from '../models/TodoUpdateParam'
import { paramsDeleteDueDate, paramsDoneOrImportant, paramsUpdateDueDate } from './updateQueries'
import { CreateAttachRequest } from '../requests/CreateAttachRequest'
import { URL } from 'url'


const todosAccess = new TodoAccess()

export async function getTodosByUser(userId: string): Promise<TodoItem[]> {
    return await todosAccess.getTodosByUser(userId)
}

export async function createTodo(userId: string, newTodo: CreateTodoRequest) {
    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()

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

export async function getTodoById(userId: string, todoId: string) {
    return await todosAccess.getTodoById(userId, todoId)
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

export async function addUrlTodo(userId: string, todoId: string, attachId: string, bucketURL: string, newAttach: CreateAttachRequest) {
    // Add attachment URL to Attachment's Table 1:M todoId:attachId

    const attachmentUrl = new URL(attachId, bucketURL)
    let todo = (await getTodoById(userId, todoId)).Item

    if (!("attachments" in todo)) {
        todo["attachments"] = {}
    }

    todo.attachments[attachId] = {
        attachmentUrl: attachmentUrl.toString(),
        ...newAttach
    }

    const params: TodoUpdateParams = {
        Key: {
            "userId": userId,
            "todoId": todoId
        },
        UpdateExpression: "set attachments = :attachments",
        ExpressionAttributeValues: {
            ":attachments": todo.attachments
        }
    };
    return await todosAccess.updateTodo(params)
}

export async function deleteAttachment(attachId: string, todoId: string, userId: string) {
    const todo = (await getTodoById(userId, todoId)).Item
    let todoAttachments = todo.attachments

    delete todoAttachments[attachId]
    let params: TodoUpdateParams;

    if (Object.keys(todoAttachments).length > 0) {
        params = {
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "set attachments = :attachments",
            ExpressionAttributeValues: {
                ":attachments": todoAttachments
            }
        };
    }
    else {
        params = {
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "remove attachments",
        }
    }

    return await todosAccess.updateTodo(params)
}
