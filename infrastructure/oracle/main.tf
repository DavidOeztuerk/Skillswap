# =============================================================================
# Skillswap - Oracle Cloud Infrastructure (OCI) Terraform Configuration
# =============================================================================
# This configuration deploys the Skillswap microservices architecture to OCI
# using Container Instances, Autonomous Database, and OCI Cache (Redis).
#
# Prerequisites:
# - Oracle Cloud account with Free Tier or Pay-as-you-go
# - OCI CLI configured (~/.oci/config)
# - Terraform >= 1.0
#
# Usage:
#   terraform init
#   terraform plan -var-file="terraform.tfvars"
#   terraform apply -var-file="terraform.tfvars"
# =============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0"
    }
  }

  # Optional: Remote state backend (recommended for team use)
  # backend "s3" {
  #   bucket   = "skillswap-terraform-state"
  #   key      = "oracle/terraform.tfstate"
  #   region   = "eu-frankfurt-1"
  #   endpoint = "https://<namespace>.compat.objectstorage.eu-frankfurt-1.oraclecloud.com"
  # }
}

# =============================================================================
# Provider Configuration
# =============================================================================

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# =============================================================================
# Data Sources
# =============================================================================

# Get availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# Get the latest Oracle Linux image for ARM (Free Tier eligible)
data "oci_core_images" "oracle_linux_arm" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# Get the latest Oracle Linux image for AMD (if needed)
data "oci_core_images" "oracle_linux_amd" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  shape                    = "VM.Standard.E4.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# =============================================================================
# Local Variables
# =============================================================================

locals {
  # Environment-specific naming
  env_suffix = var.environment == "production" ? "prod" : "staging"
  name_prefix = "skillswap-${local.env_suffix}"

  # Common tags
  common_tags = {
    Environment = var.environment
    Project     = "Skillswap"
    ManagedBy   = "Terraform"
    Repository  = "github.com/DavidOeztuerk/Skillswap"
  }

  # Services configuration
  services = {
    gateway = {
      name     = "gateway"
      port     = 8080
      cpu      = 1
      memory   = 2
      replicas = 1
    }
    userservice = {
      name     = "userservice"
      port     = 5001
      cpu      = 1
      memory   = 2
      replicas = 1
    }
    skillservice = {
      name     = "skillservice"
      port     = 5002
      cpu      = 1
      memory   = 2
      replicas = 1
    }
    matchmakingservice = {
      name     = "matchmakingservice"
      port     = 5003
      cpu      = 1
      memory   = 2
      replicas = 1
    }
    appointmentservice = {
      name     = "appointmentservice"
      port     = 5004
      cpu      = 1
      memory   = 2
      replicas = 1
    }
    notificationservice = {
      name     = "notificationservice"
      port     = 5005
      cpu      = 1
      memory   = 2
      replicas = 1
    }
    chatservice = {
      name     = "chatservice"
      port     = 5006
      cpu      = 1
      memory   = 2
      replicas = 1
    }
    videocallservice = {
      name     = "videocallservice"
      port     = 5007
      cpu      = 1
      memory   = 2
      replicas = 1
    }
    frontend = {
      name     = "frontend"
      port     = 80
      cpu      = 1
      memory   = 1
      replicas = 1
    }
  }
}
