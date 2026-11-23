# Custom domain for CloudFront. DNS for cloud-engineer.dev is hosted at name.com, not Route 53,
# so both records below are added there by hand:
#   1. the ACM validation CNAME (output acm_validation_record). ACM reuses the same record for the
#      same domain in this account, so leave it in place and re-creates after teardown validate on their own.
#   2. a CNAME from the subdomain to the distribution (output dns_cname). It changes on every re-create.

variable "domain_name" {
  type    = string
  default = "pixel2code.cloud-engineer.dev"
}

# CloudFront only accepts certificates from us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags { tags = { Project = "ss-to-code", ManagedBy = "terraform" } }
}

resource "aws_acm_certificate" "site" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"
  lifecycle { create_before_destroy = true }
}

# Waits until the validation CNAME at name.com is in place and ACM has issued the certificate
resource "aws_acm_certificate_validation" "site" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.site.arn
  timeouts { create = "30m" }
}

output "site_url" { value = "https://${var.domain_name}" }

output "acm_validation_record" {
  value = [for o in aws_acm_certificate.site.domain_validation_options : {
    type  = o.resource_record_type
    name  = o.resource_record_name
    value = o.resource_record_value
  }]
}

output "dns_cname" {
  value = "${var.domain_name} CNAME ${aws_cloudfront_distribution.site.domain_name}"
}
