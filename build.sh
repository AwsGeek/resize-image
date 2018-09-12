#!/bin/bash
aws_region=$1
package_bucket=$2
stack_name=$3
input_bucket_name=$4
output_bucket_name=$5
image_width=$6
image_height=$7

aws --region $aws_region cloudformation package --template-file template.yaml --s3-bucket $package_bucket --output-template-file package.yaml
aws --region $aws_region cloudformation deploy --template-file package.yaml --stack-name $stack_name --capabilities CAPABILITY_IAM --parameter-overrides InputBucketName=$input_bucket_name OutputBucketName=$output_bucket_name ImageWidth=$image_width ImageHeight=$image_height


