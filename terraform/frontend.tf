# Frontend hosting: private S3 bucket (static Next.js export) behind CloudFront.
# CloudFront also routes /api/* to the FastAPI NodePort on EC2, so everything is same-origin.

resource "aws_eip" "box" {
  instance = aws_instance.box.id
  domain   = "vpc"
  tags     = { Name = "ss-to-code" }
}

data "aws_caller_identity" "me" {}

resource "aws_s3_bucket" "site" {
  bucket        = "ss-to-code-site-${data.aws_caller_identity.me.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

# Versioning = rollback by restoring previous object versions
resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_lifecycle_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    id     = "expire-old-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration { noncurrent_days = 14 }
  }
  depends_on = [aws_s3_bucket_versioning.site]
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "ss-to-code-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.site.arn}/*"
      Condition = { StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.site.arn } }
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.site]
}

# S3 REST origins don't serve index files for sub-paths: /studio/ and /studio -> /studio/index.html
resource "aws_cloudfront_function" "index" {
  name    = "ss-to-code-index-rewrite"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-JS
    function handler(event) {
      var r = event.request;
      if (r.uri.endsWith('/')) { r.uri += 'index.html'; }
      else if (!r.uri.split('/').pop().includes('.')) { r.uri += '/index.html'; }
      return r;
    }
  JS
}

data "aws_cloudfront_cache_policy" "optimized" { name = "Managed-CachingOptimized" }
data "aws_cloudfront_cache_policy" "disabled" { name = "Managed-CachingDisabled" }
data "aws_cloudfront_origin_request_policy" "all_but_host" { name = "Managed-AllViewerExceptHostHeader" }

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "ss-to-code"
  default_root_object = "index.html"
  price_class         = "PriceClass_200"

  origin {
    origin_id                = "s3"
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  origin {
    origin_id   = "api"
    domain_name = aws_eip.box.public_dns
    custom_origin_config {
      http_port              = var.backend_node_port
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 60
    }
  }

  default_cache_behavior {
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.index.arn
    }
  }

  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = "api"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = false
    cache_policy_id          = data.aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_but_host.id
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }
  # OAC returns 403 for missing objects
  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate { cloudfront_default_certificate = true }
}

# Least privilege for Jenkins on the instance: write this bucket, invalidate this distribution.
# ListDistributions can't be resource-scoped; Jenkins uses it to look the distribution up by Comment.
resource "aws_iam_role_policy" "deploy" {
  name = "ss-to-code-frontend-deploy"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = "s3:ListBucket", Resource = aws_s3_bucket.site.arn },
      { Effect = "Allow", Action = ["s3:PutObject", "s3:DeleteObject"], Resource = "${aws_s3_bucket.site.arn}/*" },
      { Effect = "Allow", Action = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"], Resource = aws_cloudfront_distribution.site.arn },
      { Effect = "Allow", Action = ["cloudfront:ListDistributions", "s3:ListAllMyBuckets"], Resource = "*" },
    ]
  })
}

# Budget guardrail (account-wide, visible in Billing console). Removed by terraform destroy.
resource "aws_budgets_budget" "weekly" {
  name         = "ss-to-code-10usd"
  budget_type  = "COST"
  limit_amount = "10"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
}
