// Phase 1: Infrastructure Only (No Container Apps)
// This deploys first, before Docker images exist

@description('Azure region for resources')
param location string = 'westeurope'

@description('Environment name (staging, production)')
param environmentName string = 'staging'

@secure()
@description('PostgreSQL admin password')
param postgresPassword string

@secure()
@description('JWT Secret for authentication')
param jwtSecret string

// Variables
var acrName = 'skillswap${environmentName}acr'
var postgresName = 'skillswap-${environmentName}-postgres'
var redisName = 'skillswap${environmentName}redis'
var serviceBusName = 'skillswap-${environmentName}-bus'

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: postgresName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'skillswapadmin'
    administratorLoginPassword: postgresPassword
    storage: {
      storageSizeGB: 32
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// PostgreSQL Firewall Rule - Allow Azure Services
resource postgresFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// PostgreSQL Databases
var databases = [
  'skillswap_users'
  'skillswap_skills'
  'skillswap_matchmaking'
  'skillswap_appointments'
  'skillswap_notifications'
  'skillswap_videocalls'
]

@batchSize(1)
resource postgresDatabases 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = [for db in databases: {
  parent: postgresServer
  name: db
}]

// Redis Cache
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisName
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: true
    minimumTlsVersion: '1.2'
  }
}

// Service Bus (Alternative to RabbitMQ)
resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: serviceBusName
  location: location
  sku: {
    name: 'Basic'
  }
}

// Service Bus Queues
resource userEventsQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'user-events'
  properties: {
    maxDeliveryCount: 10
  }
}

resource skillEventsQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'skill-events'
  properties: {
    maxDeliveryCount: 10
  }
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'skillswap-${environmentName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Apps Environment (needed for Container Apps later)
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'skillswap-${environmentName}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Outputs for next phase
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output containerRegistryName string = containerRegistry.name
output containerRegistryUsername string = containerRegistry.listCredentials().username
output containerRegistryPassword string = containerRegistry.listCredentials().passwords[0].value
output postgresServerName string = postgresServer.properties.fullyQualifiedDomainName
output postgresConnectionString string = 'Host=${postgresServer.properties.fullyQualifiedDomainName};Database=skillswap_users;Username=skillswapadmin;Password=${postgresPassword}'
output redisHostName string = redisCache.properties.hostName
output redisConnectionString string = '${redisCache.properties.hostName}:6379,password=${redisCache.listKeys().primaryKey},ssl=True,abortConnect=False'
output serviceBusConnectionString string = listKeys('${serviceBusNamespace.id}/AuthorizationRules/RootManageSharedAccessKey', serviceBusNamespace.apiVersion).primaryConnectionString
output containerAppEnvironmentId string = containerAppEnvironment.id
output containerAppEnvironmentName string = containerAppEnvironment.name
output jwtSecret string = jwtSecret
output resourceGroupName string = resourceGroup().name