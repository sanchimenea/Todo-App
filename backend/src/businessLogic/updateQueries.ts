import { TodoUpdateParams } from "../models/TodoUpdateParam";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";

export function paramsDoneOrImportant(updatedTodo: UpdateTodoRequest, userId: string, todoId: string) {

    const params: TodoUpdateParams = {
        Key: {
            "userId": userId,
            "todoId": todoId
        },
        UpdateExpression: "set #n = :name, done = :done, #i = :important",
        ExpressionAttributeNames: {
            "#n": "name",
            "#i": "important"
        },
        ExpressionAttributeValues: {
            ":name": updatedTodo.name,
            ":done": updatedTodo.done,
            ":important": updatedTodo.important
        }
    };
    return params;
}

export function paramsUpdateDueDate(updatedTodo: UpdateTodoRequest, userId: string, todoId: string) {
    const params: TodoUpdateParams = {
        Key: {
            "userId": userId,
            "todoId": todoId
        },
        UpdateExpression: "set #n = :name, dueDate = :dueDate, done = :done, #i = :important",
        ExpressionAttributeNames: {
            "#n": "name",
            "#i": "important"
        },
        ExpressionAttributeValues: {
            ":name": updatedTodo.name,
            ":done": updatedTodo.done,
            ":important": updatedTodo.important,
            ":dueDate": updatedTodo.dueDate
        }
    };
    return params;
}

export function paramsDeleteDueDate(userId: string, todoId: string) {
    const params: TodoUpdateParams = {
        Key: {
            "userId": userId,
            "todoId": todoId
        },
        UpdateExpression: "remove #dd",
        ExpressionAttributeNames: {
            "#dd": "dueDate"
        }
    }
    return params;
}
