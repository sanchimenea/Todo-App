import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { getTodoById } from '../../businessLogic/todos'
import { getUserId } from '../utils'

const logger = createLogger('getTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event: ' + event)

    const userId = getUserId(event);
    logger.info('User of request: ' + userId)

    const todoId = event.pathParameters.todoId

    const todo = await getTodoById(userId, todoId)

    if (!todo.Item) {
        logger.warn("Do not exist, todoId: " + todoId)
        return {
            statusCode: 404,
            body: JSON.stringify({
                error: 'Todo does not exist'
            })
        }
    }

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(todo.Item)
    }
}
