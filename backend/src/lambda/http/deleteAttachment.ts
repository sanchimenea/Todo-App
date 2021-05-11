import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { deleteAttachment, todoExists } from '../../businessLogic/todos'
import { deleteFile } from '../../dataLayer/bucketAccess'



const logger = createLogger('deleteAttachment')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event: ' + event)

    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    const attachId = event.pathParameters.attachId

    const validTodoId: Boolean = await todoExists(todoId, userId)
    logger.info('Todo exists: ' + validTodoId)

    if (!validTodoId) {
        logger.warn("Do not exist, todoId: " + todoId)
        return {
            statusCode: 404,
            body: JSON.stringify({
                error: 'Todo does not exist'
            })
        }
    }

    await deleteAttachment(attachId, todoId, userId)
    await deleteFile(attachId)

    logger.info('Attachment' + attachId + 'deleted from Todo' + todoId)

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: ''
    }
}





