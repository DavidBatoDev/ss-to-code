#!/bin/bash
# Bootstraps: swap, Docker, Jenkins, k3s, Trivy, Node 22, Python, AWS CLI v2, CloudWatch agent
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

# 2G swap — t3.medium has only 4GB RAM
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

apt-get update
apt-get install -y ca-certificates curl gnupg fontconfig openjdk-21-jre python3-venv python3-pip gettext-base unzip

# Docker
curl -fsSL https://get.docker.com | sh

# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Jenkins
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key -o /usr/share/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" > /etc/apt/sources.list.d/jenkins.list
apt-get update && apt-get install -y jenkins
usermod -aG docker jenkins

# AWS CLI v2 (Jenkins deploys the frontend to S3/CloudFront)
curl -fsSLo /tmp/awscli.zip https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip
unzip -q /tmp/awscli.zip -d /tmp && /tmp/aws/install

# Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# k3s (no traefik; we use NodePort to avoid an AWS load balancer)
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik --write-kubeconfig-mode 644" sh -
mkdir -p /var/lib/jenkins/.kube
cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
chown -R jenkins:jenkins /var/lib/jenkins/.kube

# CloudWatch agent: ship syslog + container logs, memory/disk metrics
curl -fsSLo /tmp/cwagent.deb https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i /tmp/cwagent.deb
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'EOF'
{
  "metrics": {
    "namespace": "ss-to-code",
    "metrics_collected": {
      "mem": { "measurement": ["mem_used_percent"] },
      "disk": { "measurement": ["used_percent"], "resources": ["/"] }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          { "file_path": "/var/log/containers/*ss-to-code*.log", "log_group_name": "/ss-to-code/app", "log_stream_name": "{instance_id}-containers" },
          { "file_path": "/var/log/syslog", "log_group_name": "/ss-to-code/app", "log_stream_name": "{instance_id}-syslog" }
        ]
      }
    }
  }
}
EOF
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

systemctl restart jenkins
