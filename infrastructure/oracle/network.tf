# =============================================================================
# Network Configuration - VCN, Subnets, Security Lists
# =============================================================================

# -----------------------------------------------------------------------------
# Virtual Cloud Network (VCN)
# -----------------------------------------------------------------------------

resource "oci_core_vcn" "skillswap_vcn" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${local.name_prefix}-vcn"
  dns_label      = "skillswap${local.env_suffix}"

  freeform_tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Internet Gateway
# -----------------------------------------------------------------------------

resource "oci_core_internet_gateway" "internet_gateway" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.skillswap_vcn.id
  display_name   = "${local.name_prefix}-igw"
  enabled        = true

  freeform_tags = local.common_tags
}

# -----------------------------------------------------------------------------
# NAT Gateway (for private subnet outbound access)
# -----------------------------------------------------------------------------

resource "oci_core_nat_gateway" "nat_gateway" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.skillswap_vcn.id
  display_name   = "${local.name_prefix}-nat"

  freeform_tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Route Tables
# -----------------------------------------------------------------------------

# Public route table (through Internet Gateway)
resource "oci_core_route_table" "public_route_table" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.skillswap_vcn.id
  display_name   = "${local.name_prefix}-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.internet_gateway.id
  }

  freeform_tags = local.common_tags
}

# Private route table (through NAT Gateway)
resource "oci_core_route_table" "private_route_table" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.skillswap_vcn.id
  display_name   = "${local.name_prefix}-private-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.nat_gateway.id
  }

  freeform_tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Security Lists
# -----------------------------------------------------------------------------

# Public security list (Load Balancer, Frontend)
resource "oci_core_security_list" "public_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.skillswap_vcn.id
  display_name   = "${local.name_prefix}-public-sl"

  # Egress: Allow all outbound
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
    stateless   = false
  }

  # Ingress: HTTP
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "HTTP"

    tcp_options {
      min = 80
      max = 80
    }
  }

  # Ingress: HTTPS
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "HTTPS"

    tcp_options {
      min = 443
      max = 443
    }
  }

  # Ingress: SSH (restrict in production!)
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0" # TODO: Restrict to your IP in production
    stateless   = false
    description = "SSH"

    tcp_options {
      min = 22
      max = 22
    }
  }

  freeform_tags = local.common_tags
}

# Private security list (Backend services, Database)
resource "oci_core_security_list" "private_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.skillswap_vcn.id
  display_name   = "${local.name_prefix}-private-sl"

  # Egress: Allow all outbound
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
    stateless   = false
  }

  # Ingress: Allow all from VCN
  ingress_security_rules {
    protocol    = "all"
    source      = var.vcn_cidr
    stateless   = false
    description = "Allow all from VCN"
  }

  # Ingress: PostgreSQL from VCN
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr
    stateless   = false
    description = "PostgreSQL"

    tcp_options {
      min = 5432
      max = 5432
    }
  }

  # Ingress: Redis from VCN
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr
    stateless   = false
    description = "Redis"

    tcp_options {
      min = 6379
      max = 6379
    }
  }

  # Ingress: RabbitMQ from VCN
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr
    stateless   = false
    description = "RabbitMQ"

    tcp_options {
      min = 5672
      max = 5672
    }
  }

  freeform_tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Subnets
# -----------------------------------------------------------------------------

# Public Subnet (Load Balancer, Frontend)
resource "oci_core_subnet" "public_subnet" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.skillswap_vcn.id
  cidr_block                 = var.public_subnet_cidr
  display_name               = "${local.name_prefix}-public-subnet"
  dns_label                  = "public"
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.public_route_table.id
  security_list_ids          = [oci_core_security_list.public_security_list.id]

  freeform_tags = local.common_tags
}

# Private Subnet (Backend services, Database)
resource "oci_core_subnet" "private_subnet" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.skillswap_vcn.id
  cidr_block                 = var.private_subnet_cidr
  display_name               = "${local.name_prefix}-private-subnet"
  dns_label                  = "private"
  prohibit_public_ip_on_vnic = true
  route_table_id             = oci_core_route_table.private_route_table.id
  security_list_ids          = [oci_core_security_list.private_security_list.id]

  freeform_tags = local.common_tags
}
