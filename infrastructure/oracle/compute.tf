# =============================================================================
# Compute Configuration - VMs with Docker
# =============================================================================
# Using ARM-based VMs (Free Tier eligible) with Docker Compose
# This is simpler and more cost-effective than Kubernetes for MVP
# =============================================================================

# -----------------------------------------------------------------------------
# Cloud-Init Script for Docker Setup
# -----------------------------------------------------------------------------

locals {
  cloud_init_script = <<-EOF
    #!/bin/bash
    set -e

    echo "=== Skillswap Server Setup ==="

    # Update system
    dnf update -y

    # Install Docker
    dnf install -y dnf-utils
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    # Add opc user to docker group
    usermod -aG docker opc

    # Install useful tools
    dnf install -y git curl wget htop

    # Create app directory
    mkdir -p /opt/skillswap
    chown opc:opc /opt/skillswap

    # Create Docker network
    docker network create skillswap-network || true

    # Setup firewall
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=8080/tcp
    firewall-cmd --reload

    echo "=== Setup Complete ==="
  EOF

  # Docker Compose file for all services
  docker_compose_content = <<-COMPOSE
    version: '3.8'

    services:
      # ===========================================
      # Infrastructure Services
      # ===========================================

      postgres:
        image: postgres:15-alpine
        container_name: skillswap-postgres
        restart: unless-stopped
        environment:
          POSTGRES_USER: skillswap
          POSTGRES_PASSWORD: $${POSTGRES_PASSWORD}
          POSTGRES_DB: skillswap
        volumes:
          - postgres_data:/var/lib/postgresql/data
        networks:
          - skillswap-network
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U skillswap"]
          interval: 10s
          timeout: 5s
          retries: 5

      redis:
        image: redis:7-alpine
        container_name: skillswap-redis
        restart: unless-stopped
        command: redis-server --appendonly yes
        volumes:
          - redis_data:/data
        networks:
          - skillswap-network
        healthcheck:
          test: ["CMD", "redis-cli", "ping"]
          interval: 10s
          timeout: 5s
          retries: 5

      rabbitmq:
        image: rabbitmq:3-management-alpine
        container_name: skillswap-rabbitmq
        restart: unless-stopped
        environment:
          RABBITMQ_DEFAULT_USER: skillswap
          RABBITMQ_DEFAULT_PASS: $${RABBITMQ_PASSWORD}
        volumes:
          - rabbitmq_data:/var/lib/rabbitmq
        networks:
          - skillswap-network
        healthcheck:
          test: ["CMD", "rabbitmq-diagnostics", "check_running"]
          interval: 30s
          timeout: 10s
          retries: 5

      # ===========================================
      # Application Services
      # ===========================================

      gateway:
        image: $${REGISTRY}/gateway:$${IMAGE_TAG}
        container_name: skillswap-gateway
        restart: unless-stopped
        ports:
          - "8080:8080"
        environment:
          - ASPNETCORE_ENVIRONMENT=$${ENVIRONMENT}
          - ConnectionStrings__DefaultConnection=$${POSTGRES_CONNECTION}
          - ConnectionStrings__Redis=$${REDIS_CONNECTION}
          - ConnectionStrings__RabbitMQ=$${RABBITMQ_CONNECTION}
          - Jwt__Secret=$${JWT_SECRET}
        depends_on:
          postgres:
            condition: service_healthy
          redis:
            condition: service_healthy
          rabbitmq:
            condition: service_healthy
        networks:
          - skillswap-network

      userservice:
        image: $${REGISTRY}/userservice:$${IMAGE_TAG}
        container_name: skillswap-userservice
        restart: unless-stopped
        environment:
          - ASPNETCORE_ENVIRONMENT=$${ENVIRONMENT}
          - ConnectionStrings__DefaultConnection=$${POSTGRES_CONNECTION}
          - ConnectionStrings__Redis=$${REDIS_CONNECTION}
          - ConnectionStrings__RabbitMQ=$${RABBITMQ_CONNECTION}
          - Jwt__Secret=$${JWT_SECRET}
          - SuperAdmin__Password=$${SUPERADMIN_PASSWORD}
        depends_on:
          - gateway
        networks:
          - skillswap-network

      skillservice:
        image: $${REGISTRY}/skillservice:$${IMAGE_TAG}
        container_name: skillswap-skillservice
        restart: unless-stopped
        environment:
          - ASPNETCORE_ENVIRONMENT=$${ENVIRONMENT}
          - ConnectionStrings__DefaultConnection=$${POSTGRES_CONNECTION}
          - ConnectionStrings__Redis=$${REDIS_CONNECTION}
          - ConnectionStrings__RabbitMQ=$${RABBITMQ_CONNECTION}
        depends_on:
          - gateway
        networks:
          - skillswap-network

      matchmakingservice:
        image: $${REGISTRY}/matchmakingservice:$${IMAGE_TAG}
        container_name: skillswap-matchmakingservice
        restart: unless-stopped
        environment:
          - ASPNETCORE_ENVIRONMENT=$${ENVIRONMENT}
          - ConnectionStrings__DefaultConnection=$${POSTGRES_CONNECTION}
          - ConnectionStrings__Redis=$${REDIS_CONNECTION}
          - ConnectionStrings__RabbitMQ=$${RABBITMQ_CONNECTION}
        depends_on:
          - gateway
        networks:
          - skillswap-network

      appointmentservice:
        image: $${REGISTRY}/appointmentservice:$${IMAGE_TAG}
        container_name: skillswap-appointmentservice
        restart: unless-stopped
        environment:
          - ASPNETCORE_ENVIRONMENT=$${ENVIRONMENT}
          - ConnectionStrings__DefaultConnection=$${POSTGRES_CONNECTION}
          - ConnectionStrings__Redis=$${REDIS_CONNECTION}
          - ConnectionStrings__RabbitMQ=$${RABBITMQ_CONNECTION}
        depends_on:
          - gateway
        networks:
          - skillswap-network

      notificationservice:
        image: $${REGISTRY}/notificationservice:$${IMAGE_TAG}
        container_name: skillswap-notificationservice
        restart: unless-stopped
        environment:
          - ASPNETCORE_ENVIRONMENT=$${ENVIRONMENT}
          - ConnectionStrings__DefaultConnection=$${POSTGRES_CONNECTION}
          - ConnectionStrings__Redis=$${REDIS_CONNECTION}
          - ConnectionStrings__RabbitMQ=$${RABBITMQ_CONNECTION}
        depends_on:
          - gateway
        networks:
          - skillswap-network

      chatservice:
        image: $${REGISTRY}/chatservice:$${IMAGE_TAG}
        container_name: skillswap-chatservice
        restart: unless-stopped
        environment:
          - ASPNETCORE_ENVIRONMENT=$${ENVIRONMENT}
          - ConnectionStrings__DefaultConnection=$${POSTGRES_CONNECTION}
          - ConnectionStrings__Redis=$${REDIS_CONNECTION}
          - ConnectionStrings__RabbitMQ=$${RABBITMQ_CONNECTION}
        depends_on:
          - gateway
        networks:
          - skillswap-network

      videocallservice:
        image: $${REGISTRY}/videocallservice:$${IMAGE_TAG}
        container_name: skillswap-videocallservice
        restart: unless-stopped
        environment:
          - ASPNETCORE_ENVIRONMENT=$${ENVIRONMENT}
          - ConnectionStrings__DefaultConnection=$${POSTGRES_CONNECTION}
          - ConnectionStrings__Redis=$${REDIS_CONNECTION}
          - ConnectionStrings__RabbitMQ=$${RABBITMQ_CONNECTION}
        depends_on:
          - gateway
        networks:
          - skillswap-network

      frontend:
        image: $${REGISTRY}/frontend:$${IMAGE_TAG}
        container_name: skillswap-frontend
        restart: unless-stopped
        ports:
          - "80:80"
          - "443:443"
        environment:
          - VITE_API_BASE_URL=http://gateway:8080
        depends_on:
          - gateway
        networks:
          - skillswap-network

      # ===========================================
      # Monitoring (Optional)
      # ===========================================

      watchtower:
        image: containrrr/watchtower
        container_name: skillswap-watchtower
        restart: unless-stopped
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock
        environment:
          - WATCHTOWER_CLEANUP=true
          - WATCHTOWER_POLL_INTERVAL=300
        networks:
          - skillswap-network

    # ===========================================
    # Volumes
    # ===========================================

    volumes:
      postgres_data:
      redis_data:
      rabbitmq_data:

    # ===========================================
    # Networks
    # ===========================================

    networks:
      skillswap-network:
        external: true
  COMPOSE
}

# -----------------------------------------------------------------------------
# Main Application VM (ARM - Free Tier)
# -----------------------------------------------------------------------------

resource "oci_core_instance" "skillswap_vm" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "${local.name_prefix}-vm"
  shape               = var.vm_shape

  shape_config {
    ocpus         = var.vm_ocpus
    memory_in_gbs = var.vm_memory_gb
  }

  create_vnic_details {
    subnet_id                 = oci_core_subnet.public_subnet.id
    display_name              = "${local.name_prefix}-vnic"
    assign_public_ip          = true
    assign_private_dns_record = true
    hostname_label            = "skillswap"
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.oracle_linux_arm.images[0].id
    boot_volume_size_in_gbs = 100 # Free Tier: up to 200GB total
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(local.cloud_init_script)
  }

  freeform_tags = local.common_tags

  lifecycle {
    ignore_changes = [source_details[0].source_id]
  }
}

# -----------------------------------------------------------------------------
# Reserved Public IP (Static IP)
# -----------------------------------------------------------------------------

resource "oci_core_public_ip" "skillswap_public_ip" {
  compartment_id = var.compartment_ocid
  display_name   = "${local.name_prefix}-public-ip"
  lifetime       = "RESERVED"

  freeform_tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Boot Volume Backup Policy (Optional)
# -----------------------------------------------------------------------------

resource "oci_core_volume_backup_policy_assignment" "vm_backup" {
  asset_id  = oci_core_instance.skillswap_vm.boot_volume_id
  policy_id = data.oci_core_volume_backup_policies.predefined_policies.volume_backup_policies[0].id
}

data "oci_core_volume_backup_policies" "predefined_policies" {
  filter {
    name   = "display_name"
    values = ["silver"] # bronze, silver, gold
  }
}
