# Deployment Guide - GCP VM

This guide walks you through deploying the CRM platform to your GCP VM with Docker.

---

## Prerequisites

- GCP VM with Docker and Docker Compose installed
- PostgreSQL credentials (will be in Docker container)
- Domain name (optional, for production)
- SSH access to your VM

---

## Step 1: Prepare Your VM

### Install Docker & Docker Compose

```bash
# Update packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Logout and login again for group changes
exit
```

---

## Step 2: Transfer Code to VM

### Option A: Via SCP

```bash
# From your local machine (where you built the code)
cd /app
tar -czf crm-platform.tar.gz .

# Transfer to VM
scp crm-platform.tar.gz user@YOUR_VM_IP:/home/user/

# SSH into VM
ssh user@YOUR_VM_IP

# Extract
cd /home/user
tar -xzf crm-platform.tar.gz
mv crm-platform
