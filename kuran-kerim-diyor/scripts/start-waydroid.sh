#!/usr/bin/env bash
set -euo pipefail

readonly bridge_ip="192.168.240.1"
readonly metro_port="8081"

if ! waydroid status 2>/dev/null | grep -q $'Session:\tRUNNING'; then
  waydroid show-full-ui >/tmp/kuran-waydroid.log 2>&1 &
fi

waydroid_ip=""
for _ in {1..30}; do
  waydroid_ip="$(waydroid status 2>/dev/null | awk -F $'\t' '/IP address:/ { print $2 }')"
  if [[ "$waydroid_ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$waydroid_ip" || "$waydroid_ip" == "UNKNOWN" ]]; then
  echo "Waydroid IP adresi alınamadı. Waydroid penceresini açıp tekrar dene." >&2
  exit 1
fi

while read -r stale_device _; do
  [[ "$stale_device" == 192.168.240.*:* ]] && adb disconnect "$stale_device" >/dev/null
done < <(adb devices)

adb connect "${waydroid_ip}:5555" >/dev/null
device_state="$(adb -s "${waydroid_ip}:5555" get-state 2>/dev/null || true)"
if [[ "$device_state" != "device" ]]; then
  echo "Waydroid ADB izni bekliyor. Android'deki USB debugging penceresini bir kez onayla." >&2
  exit 1
fi

# Metro hazır olduğunda Expo Go'yu doğrudan aç. Expo CLI'nin emülatör
# keşfine ve değişken Wi-Fi adreslerine bağımlı kalma.
(
  for _ in {1..60}; do
    if curl -fsS "http://${bridge_ip}:${metro_port}/status" | grep -q "packager-status:running"; then
      adb -s "${waydroid_ip}:5555" shell am start \
        -a android.intent.action.VIEW \
        -d "exp://${bridge_ip}:${metro_port}" \
        host.exp.exponent >/dev/null
      exit 0
    fi
    sleep 1
  done
) &

export REACT_NATIVE_PACKAGER_HOSTNAME="$bridge_ip"
exec npx expo start --clear --lan --port "$metro_port"
