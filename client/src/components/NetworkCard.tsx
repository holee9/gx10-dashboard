import { useEffect, useState } from 'react';
import { fetchApi } from '../hooks/useFetch';

type InterfaceType = 'ethernet' | 'wifi' | 'sfp' | 'vpn' | 'bridge' | 'virtual' | 'loopback';

interface NetworkInterface {
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

interface NetworkStatus {
  interfaces: NetworkInterface[];
  primaryInterface: string | null;
  primaryIp: string | null;
  tailscaleIp: string | null;
}

function getStateColor(state: 'up' | 'down' | 'unknown'): string {
  switch (state) {
    case 'up': return 'bg-gx-green';
    case 'down': return 'bg-gray-600';
    default: return 'bg-gx-yellow';
  }
}

export function NetworkCard() {
  const [network, setNetwork] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const data = await fetchApi<NetworkStatus>('/api/metrics/network');
        setNetwork(data);
      } catch {
        // Network info not available
      } finally {
        setLoading(false);
      }
    };

    fetchNetwork();
    const interval = setInterval(fetchNetwork, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filter to show only physical interfaces and VPN
  const visibleInterfaces = network?.interfaces.filter(iface =>
    ['ethernet', 'sfp', 'wifi', 'vpn'].includes(iface.type)
  ) || [];

  return (
    <div className="card h-full">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>Network</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin h-5 w-5 text-gx-cyan" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : !network ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          Network unavailable
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
          {visibleInterfaces.map((iface) => (
            <div
              key={iface.name}
              className={`p-1.5 bg-gx-dark rounded flex items-center gap-2 ${
                iface.state === 'up' ? 'border-l-2 border-gx-green' : ''
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStateColor(iface.state)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-mono ${iface.state === 'up' ? 'text-white' : 'text-gray-500'}`}>
                    {iface.name}
                  </span>
                  {iface.isConnectX && (
                    <span className="text-[10px] text-gx-purple">CX7</span>
                  )}
                </div>
                {iface.state === 'up' && iface.ipv4 && (
                  <div className="text-[10px] text-gray-400 font-mono">{iface.ipv4}</div>
                )}
              </div>
              {iface.state === 'up' && iface.speed && (
                <span className="text-[10px] text-gx-green flex-shrink-0">{iface.speed}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
