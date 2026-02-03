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

function getInterfaceIcon(type: InterfaceType, isConnectX?: boolean) {
  if (isConnectX) {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }

  switch (type) {
    case 'ethernet':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      );
    case 'sfp':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'wifi':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      );
    case 'vpn':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case 'bridge':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
  }
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
  const [showAll, setShowAll] = useState(false);

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
    const interval = setInterval(fetchNetwork, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter interfaces to show
  const visibleInterfaces = network?.interfaces.filter(iface => {
    if (showAll) return true;
    // Always show physical interfaces and VPN
    return ['ethernet', 'sfp', 'wifi', 'vpn'].includes(iface.type);
  }) || [];

  const upCount = network?.interfaces.filter(i => i.state === 'up').length || 0;

  return (
    <div className="card">
      <div className="card-header">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>Network</span>
        <span className="ml-auto text-xs text-gray-400">
          {upCount} active
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-gx-cyan" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : !network ? (
        <div className="text-center py-8 text-gray-500">
          <p>Network information unavailable</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Primary IP Summary */}
          {network.primaryIp && (
            <div className="p-2 bg-gx-dark rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-400">Primary IP</span>
              <span className="text-white font-mono">{network.primaryIp}</span>
            </div>
          )}
          {network.tailscaleIp && (
            <div className="p-2 bg-gx-dark rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-400">Tailscale</span>
              <span className="text-gx-purple font-mono">{network.tailscaleIp}</span>
            </div>
          )}

          {/* Interface List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {visibleInterfaces.map((iface) => (
              <div
                key={iface.name}
                className={`p-2 bg-gx-dark rounded-lg ${
                  iface.state === 'up' ? 'border-l-2 border-gx-green' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`${iface.state === 'up' ? 'text-gx-cyan' : 'text-gray-500'}`}>
                    {getInterfaceIcon(iface.type, iface.isConnectX)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm ${iface.state === 'up' ? 'text-white' : 'text-gray-500'}`}>
                        {iface.name}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${getStateColor(iface.state)}`} />
                      {iface.isConnectX && (
                        <span className="badge badge-purple text-xs">ConnectX-7</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {iface.description}
                    </div>
                  </div>
                  <div className="text-right">
                    {iface.state === 'up' && iface.speed && (
                      <div className="text-xs text-gx-green">{iface.speed}</div>
                    )}
                    {iface.ipv4 && (
                      <div className="text-xs text-gray-400 font-mono">{iface.ipv4}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Toggle */}
          {network.interfaces.length > visibleInterfaces.length && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-center text-sm text-gx-cyan hover:text-gx-cyan/80 py-1"
            >
              Show {network.interfaces.length - visibleInterfaces.length} more interfaces
            </button>
          )}
          {showAll && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-400 py-1"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
