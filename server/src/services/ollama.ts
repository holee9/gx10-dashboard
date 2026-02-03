import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaRunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  expires_at: string;
  size_vram: number;
}

export interface OllamaStatus {
  status: 'running' | 'stopped' | 'unknown';
  version?: string;
  models: OllamaModel[];
  running_models: OllamaRunningModel[];
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getOllamaStatus(): Promise<OllamaStatus> {
  const result: OllamaStatus = {
    status: 'unknown',
    models: [],
    running_models: [],
  };

  // Check if Ollama is running
  try {
    const healthResponse = await fetch(`${OLLAMA_API_URL}/api/version`);
    if (healthResponse.ok) {
      result.status = 'running';
      const versionData = (await healthResponse.json()) as { version: string };
      result.version = versionData.version;
    } else {
      result.status = 'stopped';
      return result;
    }
  } catch {
    result.status = 'stopped';
    return result;
  }

  // Get list of models
  try {
    const modelsData = await fetchJson<{ models: OllamaModel[] }>(`${OLLAMA_API_URL}/api/tags`);
    result.models = modelsData.models || [];
  } catch {
    // Models not available
  }

  // Get running models
  try {
    const psData = await fetchJson<{ models: OllamaRunningModel[] }>(`${OLLAMA_API_URL}/api/ps`);
    result.running_models = psData.models || [];
  } catch {
    // Running models not available
  }

  return result;
}

export async function getOllamaModels(): Promise<OllamaModel[]> {
  try {
    const data = await fetchJson<{ models: OllamaModel[] }>(`${OLLAMA_API_URL}/api/tags`);
    return data.models || [];
  } catch {
    return [];
  }
}

export async function getOllamaRunningModels(): Promise<OllamaRunningModel[]> {
  try {
    const data = await fetchJson<{ models: OllamaRunningModel[] }>(`${OLLAMA_API_URL}/api/ps`);
    return data.models || [];
  } catch {
    return [];
  }
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/version`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function checkOllamaInstalled(): Promise<boolean> {
  try {
    await execAsync('which ollama');
    return true;
  } catch {
    return false;
  }
}
