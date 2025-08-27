// Phase 2: Container Apps (After Docker images are built)
// This deploys after images exist in ACR

@description('Container Registry Login Server')
param containerRegistryLoginServer string

@description('Container Registry Name')
param containerRegistryName string

@description('Container Registry Username')
param containerRegistryUsername string

@secure()
@description('Container Registry Password')
param containerRegistryPassword string

@description('Container Apps Environment ID')
param containerAppEnvironmentId string

@secure()
@description('PostgreSQL Connection String')
param postgresConnectionString string

@secure()
@description('Redis Connection String')
param redisConnectionString string

@secure()
@description('Service Bus Connection String')
param serviceBusConnectionString string

@secure()
@description('JWT Secret')
param jwtSecret string

@secure()
@description('Superadmin Password')
param superadminPassword string = 'Admin123!@#'

@description('Image Tag')
param imageTag string = 'latest'

@description('Location')
param location string = 'westeurope'

// Gateway Container App (Public)
resource gatewayApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'gateway'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironmentId
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
          server: containerRegistryLoginServer
          username: containerRegistryUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: containerRegistryPassword
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
        {
          name: 'superadmin-password'
          value: superadminPassword
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${containerRegistryLoginServer}/gateway:${imageTag}'
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
            {
              name: 'Jwt__Secret'
              secretRef: 'jwt-secret'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
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

// UserService Container App (Internal)
resource userServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'userservice'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironmentId
    configuration: {
      ingress: {
        external: false
        targetPort: 5001
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: containerRegistryPassword
        }
        {
          name: 'postgres-connection'
          value: postgresConnectionString
        }
        {
          name: 'redis-connection'
          value: redisConnectionString
        }
        {
          name: 'servicebus-connection'
          value: serviceBusConnectionString
        }
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
        {
          name: 'superadmin-password'
          value: superadminPassword
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${containerRegistryLoginServer}/userservice:${imageTag}'
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
            {
              name: 'SUPERADMIN_PASSWORD'
              secretRef: 'superadmin-password'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
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

// Other services follow same pattern
var services = [
  {
    name: 'skillservice'
    port: 5002
    database: 'skillswap_skills'
  }
  {
    name: 'matchmakingservice'
    port: 5003
    database: 'skillswap_matchmaking'
  }
  {
    name: 'appointmentservice'
    port: 5004
    database: 'skillswap_appointments'
  }
  {
    name: 'notificationservice'
    port: 5005
    database: 'skillswap_notifications'
  }
  {
    name: 'videocallservice'
    port: 5006
    database: 'skillswap_videocalls'
  }
]

@batchSize(1)
resource serviceApps 'Microsoft.App/containerApps@2023-05-01' = [for service in services: {
  name: service.name
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironmentId
    configuration: {
      ingress: {
        external: false
        targetPort: service.port
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: containerRegistryPassword
        }
        {
          name: 'postgres-connection'
          value: replace(postgresConnectionString, 'skillswap_users', service.database)
        }
        {
          name: 'redis-connection'
          value: redisConnectionString
        }
        {
          name: 'servicebus-connection'
          value: serviceBusConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${containerRegistryLoginServer}/${service.name}:${imageTag}'
          name: service.name
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:${service.port}'
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
          ]
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 5
      }
    }
  }
}]

// Frontend Container App (Public)
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'frontend'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironmentId
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: containerRegistryPassword
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${containerRegistryLoginServer}/frontend:${imageTag}'
          name: 'frontend'
          env: [
            {
              name: 'REACT_APP_API_URL'
              value: 'https://${gatewayApp.properties.configuration.ingress.fqdn}'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
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
output gatewayUrl string = 'https://${gatewayApp.properties.configuration.ingress.fqdn}'
output frontendUrl string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'