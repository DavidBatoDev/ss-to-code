output "public_ip" { value = aws_instance.box.public_ip }
output "jenkins_url" { value = "http://${aws_instance.box.public_ip}:8080" }
output "app_url" { value = "http://${aws_instance.box.public_ip}:30080" }
output "ssh" { value = "ssh -i <key>.pem ubuntu@${aws_instance.box.public_ip}" }
