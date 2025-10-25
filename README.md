# Dokploy Update and Deploy Application

A GitHub Action for updating and deploying applications on the [Dokploy](https://dokploy.com) platform. This action allows you to seamlessly integrate Dokploy deployments into your CI/CD pipeline.

## Usage

### Basic Usage

```yaml
name: Deploy to Dokploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Application
        uses: patrikjokhel/dokploy-update-deploy-application@v1
        with:
          dokploy-url: ${{ secrets.DOKPLOY_URL }}
          api-key: ${{ secrets.DOKPLOY_API_KEY }}
          application-id: "your-app-id"
```

### Advanced Usage

```yaml
name: Deploy to Dokploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Application with Full Configuration
        uses: patrikjokhel/dokploy-update-deploy-application@v1
        with:
          # Required inputs
          dokploy-url: ${{ secrets.DOKPLOY_URL }}
          api-key: ${{ secrets.DOKPLOY_API_KEY }}
          application-id: "your-app-id"

          # Application configuration
          name: "my-application"
          env: |
            NODE_ENV="production"
            PORT="3000"
            DATABASE_URL="postgres://..."
          replicas: "3"
          rollback-active: "true"

          # Resource limits
          memory-reservation: "268435456" # 256MB in bytes
          memory-limit: "1073741824" # 1GB in bytes
          cpu-reservation: "1000000000" # 1 CPU in shares
          cpu-limit: "2000000000" # 2 CPUs in quota units

          # Docker registry (if using private registry)
          registry-url: "registry.example.com"
          registry-username: ${{ secrets.REGISTRY_USERNAME }}
          registry-password: ${{ secrets.REGISTRY_PASSWORD }}
          docker-image: "registry.example.com/my-app:latest"

          # Deployment metadata
          deployment-title: "Production Release v${{ github.sha }}"
          deployment-description: "Deployed from commit ${{ github.sha }}"
```

## Inputs

### Required

| Input            | Description                             |
| ---------------- | --------------------------------------- |
| `dokploy-url`    | The URL of your Dokploy instance        |
| `api-key`        | API key for authenticating with Dokploy |
| `application-id` | ID of the application to deploy         |

### Optional

| Input                    | Description                                                                              | Default |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------- |
| `name`                   | Name of the application                                                                  | -       |
| `env`                    | Environment variables in newline-separated format (e.g., `KEY1="value1"\nKEY2="value2"`) | -       |
| `memory-reservation`     | Memory soft limit in bytes (e.g., `268435456` for 256MB)                                 | -       |
| `memory-limit`           | Memory hard limit in bytes (e.g., `1073741824` for 1GB)                                  | -       |
| `cpu-reservation`        | CPU shares (relative weight) (e.g., `1000000000` for 1 CPU)                              | -       |
| `cpu-limit`              | CPU quota in units of 10^-9 CPUs (e.g., `2000000000` for 2 CPUs)                         | -       |
| `registry-url`           | Docker registry URL                                                                      | -       |
| `registry-username`      | Username for Docker registry authentication                                              | -       |
| `registry-password`      | Password for Docker registry authentication                                              | -       |
| `docker-image`           | Docker image to deploy                                                                   | -       |
| `deployment-title`       | Title for the deployment                                                                 | -       |
| `deployment-description` | Description for the deployment                                                           | -       |
| `replicas`               | Number of replicas to run                                                                | -       |
| `rollback-active`        | Whether to enable rollback functionality (`true`/`false`)                                | -       |

## Outputs

| Output           | Description                        |
| ---------------- | ---------------------------------- |
| `application-id` | The ID of the deployed application |

## Prerequisites

1. **Dokploy Instance**: You need a running Dokploy instance
2. **API Key**: Generate an API key from your Dokploy dashboard
3. **Application**: The application must already exist in Dokploy (this action updates and deploys existing applications)

## Resource Specification

Resource limits and reservations use specific byte and quota formats:

- **Memory Reservation**: Memory soft limit in bytes (e.g., `268435456` = 256MB, `1073741824` = 1GB)
- **Memory Limit**: Memory hard limit in bytes (e.g., `1073741824` = 1GB, `2147483648` = 2GB)
- **CPU Reservation**: CPU shares (relative weight) (e.g., `1000000000` = 1 CPU)
- **CPU Limit**: CPU quota in units of 10^-9 CPUs (e.g., `2000000000` = 2 CPUs)

### Deploy with Environment Variables

```yaml
- name: Deploy with Environment Variables
  uses: patrikjokhel/dokploy-update-deploy-application@v1
  with:
    dokploy-url: ${{ secrets.DOKPLOY_URL }}
    api-key: ${{ secrets.DOKPLOY_API_KEY }}
    application-id: "app-123"
    env: |
      NODE_ENV="production"
      PORT="3000"
      LOG_LEVEL="info"
      API_URL="https://api.example.com"
```

### Deploy with Resource Limits

```yaml
- name: Deploy with Resource Limits
  uses: patrikjokhel/dokploy-update-deploy-application@v1
  with:
    dokploy-url: ${{ secrets.DOKPLOY_URL }}
    api-key: ${{ secrets.DOKPLOY_API_KEY }}
    application-id: "app-123"
    memory-reservation: "268435456" # 256MB soft limit
    memory-limit: "1073741824" # 1GB hard limit
    cpu-reservation: "1000000000" # 1 CPU shares
    cpu-limit: "2000000000" # 2 CPUs quota
    replicas: "3"
```

### Deploy with Private Registry

```yaml
- name: Deploy from Private Registry
  uses: patrikjokhel/dokploy-update-deploy-application@v1
  with:
    dokploy-url: ${{ secrets.DOKPLOY_URL }}
    api-key: ${{ secrets.DOKPLOY_API_KEY }}
    application-id: "app-123"
    registry-url: "registry.example.com"
    registry-username: ${{ secrets.REGISTRY_USERNAME }}
    registry-password: ${{ secrets.REGISTRY_PASSWORD }}
    docker-image: "registry.example.com/my-app:${{ github.sha }}"
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Verify your API key and Dokploy URL
2. **Application Not Found**: Ensure the application ID exists in your Dokploy instance
3. **Resource Format Errors**: Check that memory and CPU values follow the correct format
4. **Network Issues**: Ensure GitHub Actions can reach your Dokploy instance

### Debug Mode

Enable debug logging by setting the `ACTIONS_STEP_DEBUG` secret to `true` in your repository.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Dokploy Documentation](https://dokploy.com/docs)
- [Report Issues](https://github.com/patrikjokhel/dokploy-update-deploy-application/issues)
