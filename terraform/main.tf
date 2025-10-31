terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  # Create the bucket + table once (see README), then uncomment:
  # backend "s3" {
  #   bucket         = "ss-to-code-tfstate-<unique>"
  #   key            = "ss-to-code/terraform.tfstate"
  #   region         = "ap-southeast-1"
  #   dynamodb_table = "ss-to-code-tf-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.region
  default_tags { tags = { Project = "ss-to-code", ManagedBy = "terraform" } }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

