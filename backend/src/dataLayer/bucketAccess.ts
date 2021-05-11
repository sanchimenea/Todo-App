import * as AWS from "aws-sdk"


const bucketName = process.env.TODOS_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION


const s3 = new AWS.S3({
    signatureVersion: 'v4'
})

export function getUploadUrl(attachId: string) {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: attachId,
        Expires: parseInt(urlExpiration)
    })
}

export function deleteFile(attachId: string) {
    return s3.deleteObject({
        Bucket: bucketName,
        Key: attachId
    })
}