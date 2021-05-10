import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as uuid from 'uuid'

import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { addUrlTodo, todoExists } from '../../businessLogic/todos'
import { getUploadUrl } from '../../dataLayer/bucketAccess'
import { CreateAttachRequest } from '../../requests/CreateAttachRequest'


const bucketName = process.env.TODOS_S3_BUCKET
const logger = createLogger('generateUploadURL')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Processing event: ' + event)

  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)

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

  const newAttach: CreateAttachRequest = JSON.parse(event.body)


  const attachId = getAttachId(newAttach)
  const signedUrl = getUploadUrl(attachId)
  const bucketURL = `https://${bucketName}.s3.amazonaws.com/`

  await addUrlTodo(todoId, attachId, bucketURL, newAttach)

  // logger.info('Added attachment with URL: ' + attachmentUrl)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl: signedUrl
    })
  }
}


function getAttachId(newAttach: CreateAttachRequest) {
  let attachId = uuid.v4()
  if (newAttach.name.split('.').length > 1) {
    attachId = attachId + "." + newAttach.name.split('.').pop()
  }
  return attachId
}



