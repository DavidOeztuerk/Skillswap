// Azure Bicep Template für Skillswap Infrastructure
// Deployment: az deployment group create --resource-group skillswap-rg --template-file main.bicep

@description('Azure region for resources')
param location string = 'westeurope'

@description('Environment name (staging, production)')
param environmentName string = 'staging'

@secure()
@description('PostgreSQL admin password')
param postgresPassword string = 'SkillSwap2024!'

@secure()
@description('JWT Secret for authentication')
param jwtSecret string = base64(newGuid())

// Variables
var acrName = 'skillswap${environmentName}acr'
var postgresName = 'skillswap-${environmentName}-postgres'
var redisName = 'skillswap${environmentName}redis' // no hyphens in redis name
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
resource userDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'skillswap_users'
}

resource skillDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'skillswap_skills'
}

resource matchmakingDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'skillswap_matchmaking'
}

resource appointmentDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'skillswap_appointments'
}

resource notificationDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'skillswap_notifications'
}

resource videocallDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'skillswap_videocalls'
}

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

// Service Bus (Alternative zu RabbitMQ)
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

// Container Apps Environment
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
    daprAIInstrumentationKey: ''
  }
}

// Shared secrets for all Container Apps
var sharedSecrets = [
  {
    name: 'container-registry-password'
    value: containerRegistry.listCredentials().passwords[0].value
  }
  {
    name: 'postgres-connection'
    value: 'Host=${postgresServer.properties.fullyQualifiedDomainName};Database=skillswap_users;Username=skillswapadmin;Password=${postgresPassword}'
  }
  {
    name: 'redis-connection'
    value: '${redisCache.properties.hostName}:6379,password=${redisCache.listKeys().primaryKey},ssl=False,abortConnect=False'
  }
  {
    name: 'servicebus-connection'
    value: listKeys('${serviceBusNamespace.id}/AuthorizationRules/RootManageSharedAccessKey', serviceBusNamespace.apiVersion).primaryConnectionString
  }
  {
    name: 'jwt-secret'
    value: jwtSecret
  }
]

// Gateway Container App
resource gatewayApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'gateway'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: true
        }
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'container-registry-password'
        }
      ]
      secrets: sharedSecrets
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/gateway:latest'
          name: 'gateway'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:8080'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
      }
    }
  }
}

// UserService Container App
resource userServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'userservice'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: false
        targetPort: 5001
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'container-registry-password'
        }
      ]
      secrets: sharedSecrets
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/userservice:latest'
          name: 'userservice'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:5001'
            }
            {
              name: 'ConnectionStrings__DefaultConnection'
              secretRef: 'postgres-connection'
            }
            {
              name: 'Redis__ConnectionString'
              secretRef: 'redis-connection'
            }
            {
              name: 'ServiceBus__ConnectionString'
              secretRef: 'servicebus-connection'
            }
            {
              name: 'Jwt__Secret'
              secretRef: 'jwt-secret'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
      }
    }
  }
}

// SkillService Container App
resource skillServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'skillservice'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: false
        targetPort: 5002
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'container-registry-password'
        }
      ]
      secrets: sharedSecrets
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/skillservice:latest'
          name: 'skillservice'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:5002'
            }
            {
              name: 'ConnectionStrings__DefaultConnection'
              value: 'Host=${postgresServer.properties.fullyQualifiedDomainName};Database=skillswap_skills;Username=skillswapadmin;Password=${postgresPassword}'
            }
            {
              name: 'Redis__ConnectionString'
              secretRef: 'redis-connection'
            }
            {
              name: 'ServiceBus__ConnectionString'
              secretRef: 'servicebus-connection'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
      }
    }
  }
}

// MatchmakingService Container App
resource matchmakingServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'matchmakingservice'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: false
        targetPort: 5003
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'container-registry-password'
        }
      ]
      secrets: sharedSecrets
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/matchmakingservice:latest'
          name: 'matchmakingservice'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:5003'
            }
            {
              name: 'ConnectionStrings__DefaultConnection'
              value: 'Host=${postgresServer.properties.fullyQualifiedDomainName};Database=skillswap_matchmaking;Username=skillswapadmin;Password=${postgresPassword}'
            }
            {
              name: 'Redis__ConnectionString'
              secretRef: 'redis-connection'
            }
            {
              name: 'ServiceBus__ConnectionString'
              secretRef: 'servicebus-connection'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
      }
    }
  }
}

// AppointmentService Container App
resource appointmentServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'appointmentservice'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: false
        targetPort: 5004
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'container-registry-password'
        }
      ]
      secrets: sharedSecrets
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/appointmentservice:latest'
          name: 'appointmentservice'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:5004'
            }
            {
              name: 'ConnectionStrings__DefaultConnection'
              value: 'Host=${postgresServer.properties.fullyQualifiedDomainName};Database=skillswap_appointments;Username=skillswapadmin;Password=${postgresPassword}'
            }
            {
              name: 'Redis__ConnectionString'
              secretRef: 'redis-connection'
            }
            {
              name: 'ServiceBus__ConnectionString'
              secretRef: 'servicebus-connection'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
      }
    }
  }
}

// NotificationService Container App
resource notificationServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'notificationservice'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: false
        targetPort: 5005
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'container-registry-password'
        }
      ]
      secrets: sharedSecrets
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/notificationservice:latest'
          name: 'notificationservice'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:5005'
            }
            {
              name: 'ConnectionStrings__DefaultConnection'
              value: 'Host=${postgresServer.properties.fullyQualifiedDomainName};Database=skillswap_notifications;Username=skillswapadmin;Password=${postgresPassword}'
            }
            {
              name: 'Redis__ConnectionString'
              secretRef: 'redis-connection'
            }
            {
              name: 'ServiceBus__ConnectionString'
              secretRef: 'servicebus-connection'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
      }
    }
  }
}

// VideocallService Container App
resource videocallServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'videocallservice'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: false
        targetPort: 5006
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'container-registry-password'
        }
      ]
      secrets: sharedSecrets
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/videocallservice:latest'
          name: 'videocallservice'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:5006'
            }
            {
              name: 'ConnectionStrings__DefaultConnection'
              value: 'Host=${postgresServer.properties.fullyQualifiedDomainName};Database=skillswap_videocalls;Username=skillswapadmin;Password=${postgresPassword}'
            }
            {
              name: 'Redis__ConnectionString'
              secretRef: 'redis-connection'
            }
            {
              name: 'ServiceBus__ConnectionString'
              secretRef: 'servicebus-connection'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
      }
    }
  }
}

// Frontend Container App
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'frontend'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'container-registry-password'
        }
      ]
      secrets: sharedSecrets
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/frontend:latest'
          name: 'frontend'
          env: [
            {
              name: 'REACT_APP_API_URL'
              value: 'https://${gatewayApp.properties.configuration.ingress.fqdn}'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
}

// Outputs
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output containerRegistryName string = containerRegistry.name
output postgresServerName string = postgresServer.properties.fullyQualifiedDomainName
output redisCacheName string = redisCache.properties.hostName
output serviceBusNamespace string = serviceBusNamespace.name
output gatewayUrl string = 'https://${gatewayApp.properties.configuration.ingress.fqdn}'
output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'
output resourceGroupName string = resourceGroup().name