import * as AWS from "aws-sdk"
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from "../utils/logger"


const bucketName = process.env.TODOS_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION


const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})

const logger = createLogger('bucketAccess')

export function getUploadUrl(attachId: string) {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: attachId,
        Expires: parseInt(urlExpiration)
    })
}

export function deleteFile(attachId: string) {

    const params = {
        Bucket: bucketName,
        Delete: {
            Objects: [
                { Key: attachId }
            ]
        }
    }

    s3.deleteObjects(params, function (err, data) {
        if (err) logger.error(err);
        else logger.info("Delete File Success " + data)
    })
}