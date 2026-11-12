output "cloudfront_url" { value = "https://${aws_cloudfront_distribution.site.domain_name}" }
output "bucket_name" { value = aws_s3_bucket.site.bucket }
output "distribution_id" { value = aws_cloudfront_distribution.site.id }
output "public_ip" { value = aws_eip.box.public_ip }
output "jenkins_url" { value = "http://${aws_eip.box.public_ip}:8080" }
output "ssm" { value = "aws ssm start-session --target ${aws_instance.box.id} --region ${var.region}" }
