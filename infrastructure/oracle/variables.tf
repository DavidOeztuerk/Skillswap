# =============================================================================
# Variables - Oracle Cloud Infrastructure
# =============================================================================

# -----------------------------------------------------------------------------
# OCI Authentication
# -----------------------------------------------------------------------------

variable "tenancy_ocid" {
  description = "OCID of your OCI tenancy"
  type        = string
}

variable "user_ocid" {
  description = "OCID of the user calling the API"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint of the API signing key"
  type        = string
}

variable "private_key_path" {
  description = "Path to the private key file"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "compartment_ocid" {
  description = "OCID of the compartment where resources will be created"
  type        = string
}

variable "region" {
  description = "OCI region (e.g., eu-frankfurt-1)"
  type        = string
  default     = "eu-frankfurt-1"
}

# -----------------------------------------------------------------------------
# Environment Configuration
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

# -----------------------------------------------------------------------------
# Network Configuration
# -----------------------------------------------------------------------------

variable "vcn_cidr" {
  description = "CIDR block for the VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for the private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

# -----------------------------------------------------------------------------
# Compute Configuration
# -----------------------------------------------------------------------------

variable "use_free_tier" {
  description = "Use Free Tier eligible resources (ARM instances)"
  type        = bool
  default     = true
}

variable "vm_shape" {
  description = "Shape for the compute instance"
  type        = string
  default     = "VM.Standard.A1.Flex" # Free Tier eligible ARM
}

variable "vm_ocpus" {
  description = "Number of OCPUs for the VM (Free Tier: up to 4)"
  type        = number
  default     = 4
}

variable "vm_memory_gb" {
  description = "Memory in GB for the VM (Free Tier: up to 24GB)"
  type        = number
  default     = 24
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
}

# -----------------------------------------------------------------------------
# Container Registry
# -----------------------------------------------------------------------------

variable "container_registry" {
  description = "Container registry URL (OCI Container Registry)"
  type        = string
  default     = ""
}

variable "registry_username" {
  description = "Container registry username"
  type        = string
  default     = ""
  sensitive   = true
}

variable "registry_password" {
  description = "Container registry password/token"
  type        = string
  default     = ""
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

variable "db_admin_password" {
  description = "Admin password for the Autonomous Database"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_admin_password) >= 12
    error_message = "Database password must be at least 12 characters."
  }
}

variable "db_storage_tb" {
  description = "Database storage in TB (Free Tier: 0.02 = 20GB)"
  type        = number
  default     = 0.02 # 20GB - Free Tier
}

variable "db_cpu_count" {
  description = "Number of CPUs for the database (Free Tier: 1)"
  type        = number
  default     = 1
}

# -----------------------------------------------------------------------------
# Application Configuration
# -----------------------------------------------------------------------------

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "superadmin_password" {
  description = "Password for the superadmin user"
  type        = string
  sensitive   = true
}

variable "docker_image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

# -----------------------------------------------------------------------------
# Domain Configuration
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}

variable "enable_https" {
  description = "Enable HTTPS with Let's Encrypt"
  type        = bool
  default     = true
}
