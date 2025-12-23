# =============================================================================
# Outputs - Oracle Cloud Infrastructure
# =============================================================================

# -----------------------------------------------------------------------------
# Network Outputs
# -----------------------------------------------------------------------------

output "vcn_id" {
  description = "OCID of the VCN"
  value       = oci_core_vcn.skillswap_vcn.id
}

output "public_subnet_id" {
  description = "OCID of the public subnet"
  value       = oci_core_subnet.public_subnet.id
}

output "private_subnet_id" {
  description = "OCID of the private subnet"
  value       = oci_core_subnet.private_subnet.id
}

# -----------------------------------------------------------------------------
# Compute Outputs
# -----------------------------------------------------------------------------

output "vm_id" {
  description = "OCID of the compute instance"
  value       = oci_core_instance.skillswap_vm.id
}

output "vm_public_ip" {
  description = "Public IP address of the VM"
  value       = oci_core_instance.skillswap_vm.public_ip
}

output "vm_private_ip" {
  description = "Private IP address of the VM"
  value       = oci_core_instance.skillswap_vm.private_ip
}

output "reserved_public_ip" {
  description = "Reserved (static) public IP"
  value       = oci_core_public_ip.skillswap_public_ip.ip_address
}

# -----------------------------------------------------------------------------
# Application URLs
# -----------------------------------------------------------------------------

output "frontend_url" {
  description = "Frontend application URL"
  value       = "http://${oci_core_instance.skillswap_vm.public_ip}"
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "http://${oci_core_instance.skillswap_vm.public_ip}:8080"
}

# -----------------------------------------------------------------------------
# SSH Connection
# -----------------------------------------------------------------------------

output "ssh_connection" {
  description = "SSH connection command"
  value       = "ssh -i ~/.ssh/id_rsa opc@${oci_core_instance.skillswap_vm.public_ip}"
}

# -----------------------------------------------------------------------------
# Docker Commands
# -----------------------------------------------------------------------------

output "docker_deploy_command" {
  description = "Command to deploy services"
  value       = <<-EOF
    # SSH into the VM
    ssh opc@${oci_core_instance.skillswap_vm.public_ip}

    # Navigate to app directory
    cd /opt/skillswap

    # Create .env file with your secrets
    cat > .env << 'ENVFILE'
    ENVIRONMENT=${var.environment}
    REGISTRY=<your-registry>
    IMAGE_TAG=latest
    POSTGRES_PASSWORD=<your-db-password>
    POSTGRES_CONNECTION=Host=postgres;Database=skillswap;Username=skillswap;Password=<password>
    REDIS_CONNECTION=redis:6379
    RABBITMQ_PASSWORD=<your-rabbitmq-password>
    RABBITMQ_CONNECTION=amqp://skillswap:<password>@rabbitmq:5672
    JWT_SECRET=<your-jwt-secret>
    SUPERADMIN_PASSWORD=<your-superadmin-password>
    ENVFILE

    # Start services
    docker compose up -d
  EOF
}

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------

output "deployment_summary" {
  description = "Deployment summary"
  value       = <<-EOF

    ╔══════════════════════════════════════════════════════════════════╗
    ║                    Skillswap Deployment Summary                  ║
    ╠══════════════════════════════════════════════════════════════════╣
    ║  Environment:     ${var.environment}
    ║  Region:          ${var.region}
    ║  VM Shape:        ${var.vm_shape}
    ║  VM CPUs:         ${var.vm_ocpus} OCPUs
    ║  VM Memory:       ${var.vm_memory_gb} GB
    ╠══════════════════════════════════════════════════════════════════╣
    ║  Public IP:       ${oci_core_instance.skillswap_vm.public_ip}
    ║  Frontend:        http://${oci_core_instance.skillswap_vm.public_ip}
    ║  API Gateway:     http://${oci_core_instance.skillswap_vm.public_ip}:8080
    ╠══════════════════════════════════════════════════════════════════╣
    ║  SSH:             ssh opc@${oci_core_instance.skillswap_vm.public_ip}
    ╚══════════════════════════════════════════════════════════════════╝

  EOF
}
