# GX10 System Monitoring Dashboard

GX10 시스템의 상태를 웹에서 실시간으로 모니터링할 수 있는 대시보드입니다.

![Dashboard Preview](docs/preview.png)

## 주요 기능

- **실시간 시스템 모니터링**: CPU, 메모리, 디스크 사용량을 2초 간격으로 업데이트
- **GPU 모니터링**: NVIDIA GPU 사용률, VRAM, 온도, 전력 소비량 확인
- **Brain 모드 관리**: Code/Vision 모드 확인 및 전환
- **Ollama 상태**: 설치된 모델 목록 및 현재 로드된 모델 확인
- **WebSocket 실시간 업데이트**: 연결 끊김 시 자동 재연결

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Web Browser                                  │
│    http://gx10:9000                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React Dashboard (SPA)                        │  │
│  │  • CPU/Memory 모니터링     • GPU 상태                     │  │
│  │  • Brain 모드 전환         • Ollama 모델 목록             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GX10 Server (:9000)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Express.js API Server                        │  │
│  │  • GET  /api/status       - 전체 시스템 상태              │  │
│  │  • GET  /api/brain        - Brain 상태                   │  │
│  │  • POST /api/brain/switch - Brain 전환                   │  │
│  │  • GET  /api/metrics      - 실시간 메트릭                │  │
│  │  • WS   /ws               - WebSocket 업데이트           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 요구 사항

- Node.js 20 LTS 이상
- npm 10 이상
- NVIDIA GPU (nvidia-smi 필요, 선택사항)
- GX10 Brain 스크립트 (선택사항)
- Ollama (선택사항)

## 설치

### 자동 설치

```bash
cd ~/workspace/gx10-dashboard
chmod +x scripts/install.sh
sudo ./scripts/install.sh
```

### 수동 설치

```bash
# 의존성 설치
npm run install:all

# 클라이언트 빌드
cd client && npm run build && cd ..

# 서버 빌드
cd server && npm run build && cd ..

# 서버 실행
npm start
```

## 개발 모드

```bash
# 서버와 클라이언트 동시 실행
npm run dev

# 또는 개별 실행
cd server && npm run dev  # 백엔드 (포트 9000)
cd client && npm run dev  # 프론트엔드 (포트 5173, 프록시 설정됨)
```

## 서비스 관리

systemd 서비스로 설치된 경우:

```bash
# 서비스 시작
sudo systemctl start gx10-dashboard

# 서비스 중지
sudo systemctl stop gx10-dashboard

# 서비스 상태 확인
sudo systemctl status gx10-dashboard

# 로그 확인
sudo journalctl -u gx10-dashboard -f
```

## API 엔드포인트

### 시스템 상태

```bash
# 전체 상태
curl http://localhost:9000/api/status

# GPU 정보
curl http://localhost:9000/api/status/gpu

# 빠른 메트릭
curl http://localhost:9000/api/metrics
```

### Brain 제어

```bash
# 현재 상태
curl http://localhost:9000/api/brain

# Brain 전환
curl -X POST http://localhost:9000/api/brain/switch \
  -H "Content-Type: application/json" \
  -d '{"target": "vision"}'

# 전환 이력
curl http://localhost:9000/api/brain/history
```

### Ollama

```bash
# Ollama 상태
curl http://localhost:9000/api/ollama

# 설치된 모델
curl http://localhost:9000/api/ollama/models

# 로드된 모델
curl http://localhost:9000/api/ollama/ps
```

## 설정

### 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `9000` | 서버 포트 |
| `OLLAMA_API_URL` | `http://localhost:11434` | Ollama API URL |

### GX10 스크립트 경로

Brain 관련 기능은 다음 스크립트와 연동됩니다:

- `/gx10/api/status.sh` - 시스템 상태
- `/gx10/api/switch.sh` - Brain 전환
- `/gx10/runtime/active_brain.json` - Brain 상태 파일

스크립트가 없어도 대시보드는 정상 동작하며, Brain 전환 기능만 제한됩니다.

## 기술 스택

### 백엔드
- Node.js 20 LTS
- Express.js 4.x
- TypeScript 5.x
- ws (WebSocket)

### 프론트엔드
- React 18
- Vite 6
- TypeScript 5.x
- Tailwind CSS 3
- Recharts (차트)
- Zustand (상태 관리)

## 프로젝트 구조

```
gx10-dashboard/
├── server/                  # 백엔드
│   ├── src/
│   │   ├── index.ts         # 서버 진입점
│   │   ├── routes/          # API 라우트
│   │   │   ├── status.ts    # 시스템 상태
│   │   │   ├── brain.ts     # Brain 제어
│   │   │   └── metrics.ts   # 메트릭 API
│   │   ├── services/        # 비즈니스 로직
│   │   │   ├── system.ts    # CPU/메모리
│   │   │   ├── nvidia.ts    # GPU
│   │   │   ├── brain.ts     # Brain
│   │   │   └── ollama.ts    # Ollama
│   │   └── websocket.ts     # WebSocket
│   └── package.json
├── client/                  # 프론트엔드
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/      # React 컴포넌트
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── store/           # Zustand 스토어
│   │   └── styles/          # CSS
│   └── package.json
├── scripts/
│   └── install.sh           # 설치 스크립트
├── package.json
└── README.md
```

## 트러블슈팅

### 외부에서 접속이 안 될 때 (ERR_CONNECTION_TIMED_OUT)

방화벽에서 포트 9000이 막혀 있을 수 있습니다.

```bash
# 포트 9000 열기
sudo iptables -I INPUT -p tcp --dport 9000 -j ACCEPT

# 또는 ufw 사용 시
sudo ufw allow 9000/tcp
```

### 접속 URL

| 접속 위치 | URL |
|----------|-----|
| GX10 서버에서 | http://localhost:9000 |
| 같은 네트워크 PC에서 | http://[GX10_IP]:9000 |
| Tailscale 사용 시 | http://[Tailscale_IP]:9000 |

```bash
# GX10 IP 확인
hostname -I | awk '{print $1}'

# Tailscale IP 확인
tailscale ip -4
```

### GPU VRAM이 N/A로 표시될 때

일부 NVIDIA GPU (예: GB10)는 `nvidia-smi`에서 메모리 사용량을 지원하지 않습니다.
이 경우 VRAM 관련 항목이 "N/A"로 표시되며, 이는 정상적인 동작입니다.

```bash
# nvidia-smi에서 메모리 지원 여부 확인
nvidia-smi --query-gpu=memory.total --format=csv,noheader
# [N/A] 출력 시 해당 GPU는 메모리 쿼리 미지원
```

### TypeScript 빌드 오류

#### import.meta 관련 오류

```
error TS1470: The 'import.meta' meta-property is not allowed in files which will build into CommonJS output.
```

**해결**: `server/package.json`에 ESM 모듈 설정 추가

```json
{
  "type": "module"
}
```

#### module/moduleResolution 불일치 오류

```
error TS5110: Option 'module' must be set to 'NodeNext' when option 'moduleResolution' is set to 'NodeNext'.
```

**해결**: `server/tsconfig.json`에서 module과 moduleResolution 일치시키기

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

### 서버가 이미 실행 중일 때

```bash
# 포트 9000 사용 중인 프로세스 확인
lsof -ti:9000

# 해당 프로세스 종료
lsof -ti:9000 | xargs kill -9
```

## 개발 노트

### 알려진 제한사항

1. **GPU 메모리**: NVIDIA GB10 등 일부 GPU는 메모리 쿼리를 지원하지 않음
2. **CPU 온도**: `sensors` 명령어가 없거나 지원하지 않는 시스템에서는 null 반환
3. **Brain 스크립트**: `/gx10/api/` 경로에 스크립트가 없으면 기본값 사용

### 빌드 명령어

```bash
# 전체 빌드
npm run build

# 서버만 빌드
cd server && npm run build

# 클라이언트만 빌드
cd client && npm run build
```

## 라이선스

MIT License
