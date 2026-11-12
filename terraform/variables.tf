variable "region" {
  type    = string
  default = "ap-southeast-1"
}

variable "instance_type" {
  type    = string
  default = "t3.medium"
}

variable "key_name" {
  type        = string
  default     = ""
  description = "Optional EC2 key pair name (SSM Session Manager works without one)"
}

variable "my_ip_cidr" {
  type        = string
  description = "Your public IP in CIDR form, e.g. 1.2.3.4/32"
}

variable "backend_node_port" {
  type    = number
  default = 30800
}
