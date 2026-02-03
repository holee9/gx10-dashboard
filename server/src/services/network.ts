import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type InterfaceType = 'ethernet' | 'wifi' | 'sfp' | 'vpn' | 'bridge' | 'virtual' | 'loopback';

export interface NetworkInterface {
  name: string;
  type: InterfaceType;
  state: 'up' | 'down' | 'unknown';
  mac: string | null;
  ipv4: string | null;
  ipv6: string | null;
  speed: string | null;
  driver: string | null;
  description: string;
  isConnectX?: boolean;
  pciAddress?: string;
}

export interface NetworkStatus {
  interfaces: NetworkInterface[];
  primaryInterface: string | null;
  primaryIp: string | null;
  tailscaleIp: string | null;
}

// Known interface patterns for GX10
const INTERFACE_PATTERNS: { pattern: RegExp; type: InterfaceType; description: string }[] = [
  { pattern: /^lo$/, type: 'loopback', description: 'Loopback' },
  { pattern: /^enP7s7$/, type: 'ethernet', description: 'Onboard Ethernet (RJ45)' },
  { pattern: /^enp1s0f[01]np[01]$/, type: 'sfp', description: 'ConnectX-7 SFP+ Port' },
  { pattern: /^enP2p1s0f[01]np[01]$/, type: 'sfp', description: 'ConnectX-7 SFP+ Port' },
  { pattern: /^wl/, type: 'wifi', description: 'WiFi' },
  { pattern: /^tailscale/, type: 'vpn', description: 'Tailscale VPN' },
  { pattern: /^docker/, type: 'bridge', description: 'Docker Bridge' },
  { pattern: /^veth/, type: 'virtual', description: 'Docker Container' },
  { pattern: /^br-/, type: 'bridge', description: 'Bridge Network' },
];

function getInterfaceInfo(name: string): { type: InterfaceType; description: string } {
  for (const { pattern, type, description } of INTERFACE_PATTERNS) {
    if (pattern.test(name)) {
      return { type, description };
    }
  }
  return { type: 'ethernet', description: 'Network Interface' };
}

async function getInterfaceSpeed(name: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`ethtool ${name} 2>/dev/null | grep "Speed:"`);
    const match = stdout.match(/Speed:\s*(\d+\w+\/s)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function getInterfaceDriver(name: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`ethtool -i ${name} 2>/dev/null | grep "driver:"`);
    const match = stdout.match(/driver:\s*(\S+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function getPciAddress(name: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`ethtool -i ${name} 2>/dev/null | grep "bus-info:"`);
    const match = stdout.match(/bus-info:\s*(\S+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  const interfaces: NetworkInterface[] = [];
  let primaryInterface: string | null = null;
  let primaryIp: string | null = null;
  let tailscaleIp: string | null = null;

  try {
    // Get all interfaces with their states
    const { stdout: ipOutput } = await execAsync('ip -o addr show 2>/dev/null');
    const lines = ipOutput.trim().split('\n');

    const interfaceData: Map<string, {
      state: 'up' | 'down' | 'unknown';
      mac: string | null;
      ipv4: string | null;
      ipv6: string | null;
    }> = new Map();

    // Get link states
    const { stdout: linkOutput } = await execAsync('ip -o link show 2>/dev/null');
    const linkLines = linkOutput.trim().split('\n');

    for (const line of linkLines) {
      const nameMatch = line.match(/^\d+:\s+(\S+?)[@:].*state\s+(\S+)/);
      if (nameMatch) {
        const name = nameMatch[1].replace(/@.*$/, '');
        const stateStr = nameMatch[2].toLowerCase();
        const state = stateStr === 'up' ? 'up' : stateStr === 'down' ? 'down' : 'unknown';
        const macMatch = line.match(/link\/\S+\s+([0-9a-f:]+)/i);

        if (!interfaceData.has(name)) {
          interfaceData.set(name, {
            state,
            mac: macMatch ? macMatch[1] : null,
            ipv4: null,
            ipv6: null,
          });
        }
      }
    }

    // Get IP addresses
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 4) continue;

      const name = parts[1].replace(/@.*$/, '');
      const addrType = parts[2];
      const addr = parts[3].split('/')[0];

      const data = interfaceData.get(name);
      if (data) {
        if (addrType === 'inet') {
          data.ipv4 = addr;
        } else if (addrType === 'inet6' && !addr.startsWith('fe80')) {
          data.ipv6 = addr;
        }
      }
    }

    // Build interface list (exclude virtual containers and loopback)
    for (const [name, data] of interfaceData) {
      // Skip veth (Docker container interfaces) and loopback
      if (name.startsWith('veth') || name === 'lo') {
        continue;
      }

      const { type, description } = getInterfaceInfo(name);

      // Get additional info for physical interfaces
      let speed: string | null = null;
      let driver: string | null = null;
      let pciAddress: string | null = null;
      let isConnectX = false;

      if (type === 'ethernet' || type === 'sfp') {
        [speed, driver, pciAddress] = await Promise.all([
          data.state === 'up' ? getInterfaceSpeed(name) : null,
          getInterfaceDriver(name),
          getPciAddress(name),
        ]);

        isConnectX = driver === 'mlx5_core';
      }

      interfaces.push({
        name,
        type,
        state: data.state,
        mac: data.mac,
        ipv4: data.ipv4,
        ipv6: data.ipv6,
        speed,
        driver,
        description: isConnectX ? `ConnectX-7 ${type === 'sfp' ? 'SFP+' : ''} Port` : description,
        isConnectX,
        pciAddress: pciAddress ?? undefined,
      });

      // Track primary interface (first UP interface with IPv4)
      if (!primaryInterface && data.state === 'up' && data.ipv4 && type !== 'vpn' && type !== 'bridge') {
        primaryInterface = name;
        primaryIp = data.ipv4;
      }

      // Track Tailscale IP
      if (name === 'tailscale0' && data.ipv4) {
        tailscaleIp = data.ipv4;
      }
    }

    // Sort interfaces: physical first, then by name
    interfaces.sort((a, b) => {
      const typeOrder: Record<InterfaceType, number> = {
        ethernet: 0,
        sfp: 1,
        wifi: 2,
        vpn: 3,
        bridge: 4,
        virtual: 5,
        loopback: 6,
      };
      const orderDiff = typeOrder[a.type] - typeOrder[b.type];
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });

  } catch (error) {
    console.error('Error getting network status:', error);
  }

  return {
    interfaces,
    primaryInterface,
    primaryIp,
    tailscaleIp,
  };
}
