import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/docs - Returns API documentation as JSON
router.get('/', (_req: Request, res: Response) => {
  const docs = {
    name: 'GX10 Dashboard API',
    version: '2.0.0',
    description: 'System monitoring dashboard for GX10 AI workstation',
    baseUrl: '/api',
    endpoints: [
      // Health
      {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint',
        response: {
          status: 'ok',
          timestamp: 'ISO8601 string',
          uptime: 'number (seconds)',
        },
      },
      // Status
      {
        method: 'GET',
        path: '/status',
        description: 'Full system status including CPU, memory, disk, GPU, brain, and Ollama',
        response: {
          timestamp: 'ISO8601 string',
          system: 'SystemInfo object',
          cpu: 'CpuInfo object',
          memory: 'MemoryInfo object',
          disk: 'DiskInfo object',
          gpu: 'GpuInfo object',
          brain: 'BrainStatus object',
          ollama: 'OllamaStatus summary',
        },
      },
      {
        method: 'GET',
        path: '/status/system',
        description: 'System information only',
        response: 'SystemInfo object',
      },
      {
        method: 'GET',
        path: '/status/gpu',
        description: 'GPU information with running processes',
        response: {
          gpu: 'GpuInfo object',
          processes: 'GpuProcess[] array',
        },
      },
      // Brain
      {
        method: 'GET',
        path: '/brain',
        description: 'Current brain status (code or vision mode)',
        response: {
          active: 'code | vision',
          status: 'string',
          last_switch: 'ISO8601 string | null',
          scripts_available: 'boolean',
        },
      },
      {
        method: 'POST',
        path: '/brain/switch',
        description: 'Switch brain mode between code and vision',
        requestBody: {
          target: 'code | vision',
        },
        response: {
          success: 'boolean',
          message: 'string',
          previous: 'code | vision',
          current: 'code | vision',
        },
      },
      {
        method: 'GET',
        path: '/brain/history',
        description: 'Brain switch history',
        response: {
          history: 'BrainSwitchEvent[] array',
        },
      },
      // Metrics
      {
        method: 'GET',
        path: '/metrics',
        description: 'Quick metrics for real-time updates (CPU, memory, GPU)',
        response: {
          timestamp: 'ISO8601 string',
          cpu: { usage: 'number', temperature: 'number | null' },
          memory: { used: 'number (bytes)', percentage: 'number' },
          gpu: { utilization: 'number', memory_used: 'number | null', temperature: 'number', power_draw: 'number' },
        },
      },
      {
        method: 'GET',
        path: '/metrics/disk',
        description: 'Disk usage information',
        response: {
          disk: 'DiskInfo object',
        },
      },
      {
        method: 'GET',
        path: '/metrics/vision',
        description: 'Vision Brain status',
        response: 'VisionStatus object',
      },
      {
        method: 'GET',
        path: '/metrics/vision/models',
        description: 'Available vision models',
        response: {
          models: 'VisionModel[] array',
        },
      },
      {
        method: 'GET',
        path: '/metrics/storage',
        description: 'Storage status (SSD, external disks)',
        response: 'StorageStatus object',
      },
      {
        method: 'GET',
        path: '/metrics/network',
        description: 'Network interfaces status',
        response: 'NetworkStatus object',
      },
      // Ollama
      {
        method: 'GET',
        path: '/ollama',
        description: 'Ollama service status',
        response: {
          status: 'running | stopped | error',
          version: 'string | null',
          running_models: 'OllamaModel[] array',
          installed_models: 'OllamaModel[] array',
        },
      },
      {
        method: 'GET',
        path: '/ollama/models',
        description: 'All installed Ollama models',
        response: {
          models: 'OllamaModel[] array',
        },
      },
      {
        method: 'GET',
        path: '/ollama/ps',
        description: 'Currently running Ollama models',
        response: {
          models: 'OllamaModel[] array',
        },
      },
      {
        method: 'GET',
        path: '/ollama/health',
        description: 'Ollama service health check',
        response: {
          healthy: 'boolean',
          status: 'running | stopped | error',
          version: 'string | null',
        },
      },
      // Alerts
      {
        method: 'GET',
        path: '/alerts/thresholds',
        description: 'Get current alert thresholds',
        response: {
          thresholds: 'AlertThresholds object',
          defaults: 'AlertThresholds object',
        },
      },
      {
        method: 'POST',
        path: '/alerts/thresholds',
        description: 'Update alert thresholds',
        requestBody: {
          cpu: { warning: 'number (0-100)', critical: 'number (0-100)' },
          gpu_temp: { warning: 'number (0-100)', critical: 'number (0-100)' },
          memory: { warning: 'number (0-100)', critical: 'number (0-100)' },
          disk: { warning: 'number (0-100)', critical: 'number (0-100)' },
        },
        response: {
          message: 'string',
          thresholds: 'AlertThresholds object',
        },
      },
      {
        method: 'POST',
        path: '/alerts/thresholds/reset',
        description: 'Reset alert thresholds to defaults',
        response: {
          message: 'string',
          thresholds: 'AlertThresholds object',
        },
      },
      // Settings
      {
        method: 'GET',
        path: '/settings',
        description: 'Get dashboard settings',
        response: {
          config: 'DashboardConfig object',
          defaults: 'DashboardConfig object',
        },
      },
      {
        method: 'PUT',
        path: '/settings',
        description: 'Update dashboard settings',
        requestBody: 'Partial<DashboardConfig>',
        response: {
          message: 'string',
          config: 'DashboardConfig object',
        },
      },
      {
        method: 'POST',
        path: '/settings/reset',
        description: 'Reset settings to defaults',
        response: {
          message: 'string',
          config: 'DashboardConfig object',
        },
      },
      // Docs
      {
        method: 'GET',
        path: '/docs',
        description: 'API documentation (this endpoint)',
        response: 'API documentation object',
      },
      {
        method: 'GET',
        path: '/docs/openapi',
        description: 'OpenAPI 3.0 specification',
        response: 'OpenAPI 3.0 spec object',
      },
    ],
    websocket: {
      path: '/ws',
      description: 'Real-time metrics stream via WebSocket',
      updateInterval: '2000ms (configurable via settings)',
      messageFormat: {
        type: 'metrics',
        data: 'MetricsData object',
        alerts: 'AlertCheck[] array',
      },
      metricsDataSchema: {
        timestamp: 'ISO8601 string',
        cpu: { usage: 'number', temperature: 'number | null' },
        memory: { used: 'number (bytes)', percentage: 'number' },
        gpu: { utilization: 'number', memory_used: 'number | null', temperature: 'number', power_draw: 'number' },
        brain: { active: 'code | vision' },
        ollama: { models_loaded: 'string[] array' },
      },
      alertCheckSchema: {
        type: 'cpu | gpu_temp | memory | disk',
        level: 'normal | warning | critical',
        value: 'number',
        threshold: { warning: 'number', critical: 'number' },
        message: 'string',
      },
    },
  };
  res.json(docs);
});

// GET /api/docs/openapi - Returns OpenAPI 3.0 spec
router.get('/openapi', (_req: Request, res: Response) => {
  const openapi = {
    openapi: '3.0.3',
    info: {
      title: 'GX10 Dashboard API',
      version: '2.0.0',
      description: 'System monitoring dashboard for GX10 AI workstation. Provides real-time metrics, GPU monitoring, AI brain management, and Ollama integration.',
      contact: {
        name: 'GX10 Dashboard',
      },
    },
    servers: [
      {
        url: 'http://localhost:9000',
        description: 'Local development server',
      },
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          description: 'Returns server health status and uptime',
          tags: ['Health'],
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                },
              },
            },
          },
        },
      },
      '/api/status': {
        get: {
          summary: 'Full system status',
          description: 'Returns comprehensive system status including CPU, memory, disk, GPU, brain, and Ollama',
          tags: ['Status'],
          responses: {
            '200': {
              description: 'System status retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FullStatus' },
                },
              },
            },
            '500': {
              description: 'Failed to get system status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/status/system': {
        get: {
          summary: 'System information',
          description: 'Returns system information only',
          tags: ['Status'],
          responses: {
            '200': {
              description: 'System info retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SystemInfo' },
                },
              },
            },
          },
        },
      },
      '/api/status/gpu': {
        get: {
          summary: 'GPU information',
          description: 'Returns GPU information with running processes',
          tags: ['Status'],
          responses: {
            '200': {
              description: 'GPU info retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/GpuStatus' },
                },
              },
            },
          },
        },
      },
      '/api/brain': {
        get: {
          summary: 'Brain status',
          description: 'Returns current brain mode status (code or vision)',
          tags: ['Brain'],
          responses: {
            '200': {
              description: 'Brain status retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BrainStatus' },
                },
              },
            },
          },
        },
      },
      '/api/brain/switch': {
        post: {
          summary: 'Switch brain mode',
          description: 'Switch between code and vision brain modes',
          tags: ['Brain'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BrainSwitchRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Brain switched successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BrainSwitchResponse' },
                },
              },
            },
            '400': {
              description: 'Invalid target',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/brain/history': {
        get: {
          summary: 'Brain switch history',
          description: 'Returns history of brain mode switches',
          tags: ['Brain'],
          responses: {
            '200': {
              description: 'History retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/BrainHistory' },
                },
              },
            },
          },
        },
      },
      '/api/metrics': {
        get: {
          summary: 'Quick metrics',
          description: 'Returns quick metrics for real-time updates (CPU, memory, GPU)',
          tags: ['Metrics'],
          responses: {
            '200': {
              description: 'Metrics retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/QuickMetrics' },
                },
              },
            },
          },
        },
      },
      '/api/metrics/disk': {
        get: {
          summary: 'Disk usage',
          description: 'Returns disk usage information',
          tags: ['Metrics'],
          responses: {
            '200': {
              description: 'Disk info retrieved successfully',
            },
          },
        },
      },
      '/api/metrics/storage': {
        get: {
          summary: 'Storage status',
          description: 'Returns storage status including SSD and external disks',
          tags: ['Metrics'],
          responses: {
            '200': {
              description: 'Storage status retrieved successfully',
            },
          },
        },
      },
      '/api/metrics/network': {
        get: {
          summary: 'Network status',
          description: 'Returns network interfaces status',
          tags: ['Metrics'],
          responses: {
            '200': {
              description: 'Network status retrieved successfully',
            },
          },
        },
      },
      '/api/metrics/vision': {
        get: {
          summary: 'Vision status',
          description: 'Returns Vision Brain status',
          tags: ['Metrics'],
          responses: {
            '200': {
              description: 'Vision status retrieved successfully',
            },
          },
        },
      },
      '/api/metrics/vision/models': {
        get: {
          summary: 'Vision models',
          description: 'Returns available vision models',
          tags: ['Metrics'],
          responses: {
            '200': {
              description: 'Vision models retrieved successfully',
            },
          },
        },
      },
      '/api/ollama': {
        get: {
          summary: 'Ollama status',
          description: 'Returns Ollama service status',
          tags: ['Ollama'],
          responses: {
            '200': {
              description: 'Ollama status retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/OllamaStatus' },
                },
              },
            },
          },
        },
      },
      '/api/ollama/models': {
        get: {
          summary: 'Installed models',
          description: 'Returns all installed Ollama models',
          tags: ['Ollama'],
          responses: {
            '200': {
              description: 'Models retrieved successfully',
            },
          },
        },
      },
      '/api/ollama/ps': {
        get: {
          summary: 'Running models',
          description: 'Returns currently running Ollama models',
          tags: ['Ollama'],
          responses: {
            '200': {
              description: 'Running models retrieved successfully',
            },
          },
        },
      },
      '/api/ollama/health': {
        get: {
          summary: 'Ollama health',
          description: 'Returns Ollama service health check',
          tags: ['Ollama'],
          responses: {
            '200': {
              description: 'Ollama health status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/OllamaHealth' },
                },
              },
            },
          },
        },
      },
      '/api/alerts/thresholds': {
        get: {
          summary: 'Get thresholds',
          description: 'Returns current alert thresholds',
          tags: ['Alerts'],
          responses: {
            '200': {
              description: 'Thresholds retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ThresholdsResponse' },
                },
              },
            },
          },
        },
        post: {
          summary: 'Update thresholds',
          description: 'Update alert thresholds',
          tags: ['Alerts'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AlertThresholds' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Thresholds updated successfully',
            },
            '400': {
              description: 'Invalid threshold values',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/alerts/thresholds/reset': {
        post: {
          summary: 'Reset thresholds',
          description: 'Reset alert thresholds to defaults',
          tags: ['Alerts'],
          responses: {
            '200': {
              description: 'Thresholds reset successfully',
            },
          },
        },
      },
      '/api/settings': {
        get: {
          summary: 'Get settings',
          description: 'Returns dashboard settings',
          tags: ['Settings'],
          responses: {
            '200': {
              description: 'Settings retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SettingsResponse' },
                },
              },
            },
          },
        },
        put: {
          summary: 'Update settings',
          description: 'Update dashboard settings',
          tags: ['Settings'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardConfig' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Settings updated successfully',
            },
            '400': {
              description: 'Invalid settings',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/settings/reset': {
        post: {
          summary: 'Reset settings',
          description: 'Reset settings to defaults',
          tags: ['Settings'],
          responses: {
            '200': {
              description: 'Settings reset successfully',
            },
          },
        },
      },
      '/api/docs': {
        get: {
          summary: 'API documentation',
          description: 'Returns API documentation as JSON',
          tags: ['Documentation'],
          responses: {
            '200': {
              description: 'Documentation retrieved successfully',
            },
          },
        },
      },
      '/api/docs/openapi': {
        get: {
          summary: 'OpenAPI specification',
          description: 'Returns OpenAPI 3.0 specification',
          tags: ['Documentation'],
          responses: {
            '200': {
              description: 'OpenAPI spec retrieved successfully',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', description: 'Server uptime in seconds' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        SystemInfo: {
          type: 'object',
          properties: {
            hostname: { type: 'string' },
            platform: { type: 'string' },
            arch: { type: 'string' },
            kernel: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
        CpuInfo: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            cores: { type: 'integer' },
            usage: { type: 'number' },
            temperature: { type: 'number', nullable: true },
          },
        },
        MemoryInfo: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            used: { type: 'integer' },
            available: { type: 'integer' },
            percentage: { type: 'number' },
          },
        },
        GpuInfo: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            driver_version: { type: 'string' },
            memory_total: { type: 'integer' },
            memory_used: { type: 'integer', nullable: true },
            memory_free: { type: 'integer' },
            utilization: { type: 'number' },
            temperature: { type: 'number' },
            power_draw: { type: 'number' },
          },
        },
        GpuStatus: {
          type: 'object',
          properties: {
            gpu: { $ref: '#/components/schemas/GpuInfo' },
            processes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pid: { type: 'integer' },
                  name: { type: 'string' },
                  memory: { type: 'integer' },
                },
              },
            },
          },
        },
        FullStatus: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            system: { $ref: '#/components/schemas/SystemInfo' },
            cpu: { $ref: '#/components/schemas/CpuInfo' },
            memory: { $ref: '#/components/schemas/MemoryInfo' },
            disk: { type: 'object' },
            gpu: { $ref: '#/components/schemas/GpuInfo' },
            brain: { $ref: '#/components/schemas/BrainStatus' },
            ollama: { type: 'object' },
          },
        },
        BrainStatus: {
          type: 'object',
          properties: {
            active: { type: 'string', enum: ['code', 'vision'] },
            status: { type: 'string' },
            last_switch: { type: 'string', format: 'date-time', nullable: true },
            scripts_available: { type: 'boolean' },
          },
        },
        BrainSwitchRequest: {
          type: 'object',
          required: ['target'],
          properties: {
            target: { type: 'string', enum: ['code', 'vision'] },
          },
        },
        BrainSwitchResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            previous: { type: 'string', enum: ['code', 'vision'] },
            current: { type: 'string', enum: ['code', 'vision'] },
          },
        },
        BrainHistory: {
          type: 'object',
          properties: {
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  from: { type: 'string' },
                  to: { type: 'string' },
                  success: { type: 'boolean' },
                },
              },
            },
          },
        },
        QuickMetrics: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            cpu: {
              type: 'object',
              properties: {
                usage: { type: 'number' },
                temperature: { type: 'number', nullable: true },
              },
            },
            memory: {
              type: 'object',
              properties: {
                used: { type: 'integer' },
                percentage: { type: 'number' },
              },
            },
            gpu: {
              type: 'object',
              nullable: true,
              properties: {
                utilization: { type: 'number' },
                memory_used: { type: 'integer', nullable: true },
                temperature: { type: 'number' },
                power_draw: { type: 'number' },
              },
            },
          },
        },
        OllamaStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['running', 'stopped', 'error'] },
            version: { type: 'string', nullable: true },
            running_models: { type: 'array', items: { type: 'object' } },
            installed_models: { type: 'array', items: { type: 'object' } },
          },
        },
        OllamaHealth: {
          type: 'object',
          properties: {
            healthy: { type: 'boolean' },
            status: { type: 'string', enum: ['running', 'stopped', 'error'] },
            version: { type: 'string', nullable: true },
          },
        },
        AlertThreshold: {
          type: 'object',
          properties: {
            warning: { type: 'number', minimum: 0, maximum: 100 },
            critical: { type: 'number', minimum: 0, maximum: 100 },
          },
        },
        AlertThresholds: {
          type: 'object',
          properties: {
            cpu: { $ref: '#/components/schemas/AlertThreshold' },
            gpu_temp: { $ref: '#/components/schemas/AlertThreshold' },
            memory: { $ref: '#/components/schemas/AlertThreshold' },
            disk: { $ref: '#/components/schemas/AlertThreshold' },
          },
        },
        ThresholdsResponse: {
          type: 'object',
          properties: {
            thresholds: { $ref: '#/components/schemas/AlertThresholds' },
            defaults: { $ref: '#/components/schemas/AlertThresholds' },
          },
        },
        DashboardConfig: {
          type: 'object',
          properties: {
            server: {
              type: 'object',
              properties: {
                port: { type: 'integer', minimum: 1, maximum: 65535 },
                updateInterval: { type: 'integer', minimum: 500 },
              },
            },
            alerts: {
              type: 'object',
              properties: {
                thresholds: { $ref: '#/components/schemas/AlertThresholds' },
              },
            },
          },
        },
        SettingsResponse: {
          type: 'object',
          properties: {
            config: { $ref: '#/components/schemas/DashboardConfig' },
            defaults: { $ref: '#/components/schemas/DashboardConfig' },
          },
        },
        MetricsData: {
          type: 'object',
          description: 'Real-time metrics data sent via WebSocket',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            cpu: {
              type: 'object',
              properties: {
                usage: { type: 'number' },
                temperature: { type: 'number', nullable: true },
              },
            },
            memory: {
              type: 'object',
              properties: {
                used: { type: 'integer' },
                percentage: { type: 'number' },
              },
            },
            gpu: {
              type: 'object',
              nullable: true,
              properties: {
                utilization: { type: 'number' },
                memory_used: { type: 'integer', nullable: true },
                temperature: { type: 'number' },
                power_draw: { type: 'number' },
              },
            },
            brain: {
              type: 'object',
              properties: {
                active: { type: 'string', enum: ['code', 'vision'] },
              },
            },
            ollama: {
              type: 'object',
              properties: {
                models_loaded: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        AlertCheck: {
          type: 'object',
          description: 'Alert check result sent via WebSocket',
          properties: {
            type: { type: 'string', enum: ['cpu', 'gpu_temp', 'memory', 'disk'] },
            level: { type: 'string', enum: ['normal', 'warning', 'critical'] },
            value: { type: 'number' },
            threshold: { $ref: '#/components/schemas/AlertThreshold' },
            message: { type: 'string' },
          },
        },
        WebSocketMessage: {
          type: 'object',
          description: 'WebSocket message format',
          properties: {
            type: { type: 'string', enum: ['metrics'] },
            data: { $ref: '#/components/schemas/MetricsData' },
            alerts: {
              type: 'array',
              items: { $ref: '#/components/schemas/AlertCheck' },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Server health endpoints' },
      { name: 'Status', description: 'System status endpoints' },
      { name: 'Brain', description: 'AI brain management endpoints' },
      { name: 'Metrics', description: 'Real-time metrics endpoints' },
      { name: 'Ollama', description: 'Ollama LLM service endpoints' },
      { name: 'Alerts', description: 'Alert threshold management' },
      { name: 'Settings', description: 'Dashboard configuration' },
      { name: 'Documentation', description: 'API documentation endpoints' },
    ],
  };
  res.json(openapi);
});

export default router;
